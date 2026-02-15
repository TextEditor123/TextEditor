const EditKind = {
    None: 0,
    InsertLtr: 1,
    DeleteLtr: 2,
    BackspaceRtl: 3,
};

class Cursor {
    static GAP_BUFFER_SIZE = 32;

    lineIndex = 0;
    columnIndex = 0;
    positionIndex = 0;
    
    gapBuffer = new Uint8Array(Cursor.GAP_BUFFER_SIZE);
    editKind = EditKind.None;
    editPosition = 0;
    editLength = 0;

    // Each cursor needs a span they can write text to.
    gapElement;

    incrementPositionIndexAndUpdateUi(textEditor) {
        this.positionIndex++;
        if (!textEditor.editorElement) return;

        let cursorElement = textEditor.editorElement.children[textEditor.indexCursorImmediateElement];
        cursorElement.style.left = textEditor.characterWidth * this.positionIndex + "px";
    }
}

export class TextEditor {
    htmlId;
    dotNetObjectReference;
    initializedSuccessfully;
    countWellknownImmediateElements = 3;
    indexVirtualizationImmediateElement = 0;
    indexCursorImmediateElement = 1;
    indexTextImmediateElement = 2;
    primaryCursor = new Cursor();
    cursorList = [];
    editorElement = null;
    characterWidth = 1;
    lineHeight = 1;

    // TODO: You might have to overlay the edit, and target oh geez
    // TODO: When the edit is finalized, if it only is a matter of...
    // ...like they gonna continue using the same virtual line, then like
    // keep the virtual line and continue using it.
    virtualLineElement = null;

    constructor(htmlId, dotNetObjectReference) {
        this.htmlId = htmlId;
        this.dotNetObjectReference = dotNetObjectReference;

        this.cursorList.push(this.primaryCursor);

        this.initialize();
    }

    getInitializedSuccessfully() {
        return this.initializedSuccessfully;
    }

    startEdit(cursor, editKind, editPosition, editLength) {
        cursor.editKind = editKind;
        cursor.editPosition = editPosition;
        cursor.editLength = editLength;

        if (editKind == EditKind.InsertLtr) {
            // TODO: single cursor but your edit spans more than one line.
            // TODO: If you same line multicursor you need to share the virtual line
            // TODO: multicursor where each cursor different line
            this.addVirtualLine(cursor);
        }
    }

    addVirtualLine(cursor) {
        if (!cursor.gapElement) {
            cursor.gapElement = document.createElement('span');
        }

        let textElement = this.editorElement.children[this.indexTextImmediateElement];

        if (cursor.lineIndex < textElement.children.length) {
            let originalLine = textElement.children[cursor.lineIndex];

            if (!this.virtualLineElement) {
                this.virtualLineElement = document.createElement('div');
                this.virtualLineElement.className = 'te_virtual-line';
                this.virtualLineElement.style.left = 0;
                this.virtualLineElement.style.top = 0;
                this.virtualLineElement.innerHTML = textElement.children[cursor.lineIndex].innerHTML;
            }
            
            textElement.children[cursor.lineIndex].style.visibility = "hidden";


            // TODO: columnIndex
            //
            // ... you know what will cause your line index to change so you don't need
            // to consult with C# to know the line end positions.
            //
            // Part of how you know is the HTML itself for an ArrowRight case.
            //
            // TODO: Eventually spans will be used to group characters and apply syntax highlighting.
            // This isn't written yet so each div is currently just a div with... I can just add a span right now.
            //
            let columnIndex = 0;
            for (var i = 0; i < originalLine.children.length; i++) {
                let spanElement = originalLine.children[i];
                if (columnIndex < columnIndex + spanElement.textContent.length) {
                    // found the span that contains the to-be insertion split
                    break;
                }
                else {
                    columnIndex += spanElement.textContent.length;
                }
            }
        }

        this.editorElement.appendChild(this.virtualLineElement);
    }

    removeVirtualLine(cursor) {
        let textElement = this.editorElement.children[this.indexTextImmediateElement];
        if (cursor.lineIndex < textElement.children.length) {
            textElement.children[cursor.lineIndex].style.visibility = "";
        }
        this.virtualLineElement.innerHTML = '';
    }

    clearEdit(cursor) {
        if (cursor.editKind === EditKind.InsertLtr) {
            this.removeVirtualLine(cursor);
        }
        cursor.editKind = EditKind.None;
        cursor.editPosition = 0;
        cursor.editLength = 0;
    }

    // TODO: You might have to finalizeEdit onscroll. otherwise scrolling back into view the line Blazor will ???
    // ...you should be able to insert the text that they're typing using JavaScript either in a span or directly as part of the same text node that already exists.
    // "all you need to do" is guarantee that by the time Blazor registers that line as having changed that you've removed your javascript insertions by that point.
    // -----
    // Wait... what if you just used JavaScript to make the style of that line invisible, then overlayed a new div that contains the same text
    // but now you can do whatever you want cause Blazor doesn't know it exists
    // and Blazor doesn't know of style on the original div so it won't clobber anything???
    async finalizeEdit(cursor) {
        if (cursor.editLength < Cursor.GAP_BUFFER_SIZE) {
            cursor.gapBuffer[cursor.editLength] = '\0';
        }
        await this.dotNetObjectReference.invokeMethodAsync("InserText_ByteArray", cursor.editPosition, cursor.gapBuffer);
        this.clearEdit(cursor);
    }

    NOTcanBatch_insert(cursor) {
        return cursor.editKind != EditKind.InsertLtr ||
               cursor.editLength >= Cursor.GAP_BUFFER_SIZE ||
               cursor.positionIndex !== cursor.editPosition + cursor.editLength;
    }

    insertDo(cursor, event) {
        cursor.gapBuffer[cursor.editLength] = event.key.codePointAt(0);
        cursor.editLength++;
        cursor.incrementPositionIndexAndUpdateUi(this);
        // TODO: This concatenation also isn't all too great
        cursor.gapElement.innerHTML += event.key;
    }

    async onKeydown(event) {
        if (event.key.length === 1) {
            for (var i = 0; i < this.cursorList.length; i++) {
                let cursor = this.cursorList[i];

                if (this.NOTcanBatch_insert(cursor)) {
                    if (cursor.editKind != EditKind.None) {
                        await this.finalizeEdit(cursor);
                    }
                    this.startEdit(/*cursor*/ cursor, /*editKind*/ EditKind.InsertLtr, /*editPosition*/ cursor.positionIndex, /*editLength*/ 0);
                }

                this.insertDo(cursor, event);
            }
        }
    }

    registerHandles() {
        this.editorElement.addEventListener('keydown', this.onKeydown.bind(this));
    }

    initialize() {
        this.editorElement = document.getElementById(this.htmlId);
        if (!this.editorElement || this.editorElement.children.length != this.countWellknownImmediateElements) {
            this.initializedSuccessfully = false;
            return;
        }

        this.measureLineHeightAndCharacterWidth();
        this.registerHandles();

        this.initializedSuccessfully = true;
    }

    measureLineHeightAndCharacterWidth() {
        let measureElement = document.createElement('div');
        measureElement.style.width = "fit-content";
        this.editorElement.appendChild(measureElement);

        let sampleTextBuilder = [];
        for (var i = 0; i < 11; i++) {
            // This is quite silly.
            // The font is intended to be monospace.
            //
            // Given the comment about monospace, all in all what this method does is:
            // 36 characters repeated 11 times
            //
            // I've in the past found this to give the most accurrate character width.
            //
            // I don't want to store this string as one massive string that is 11 times the size,
            // because then it has to sit (presumably) as an interned string or in some data section
            // all app long.
            //
            // Since this is doing a "builder" and monospace, it might be similar to just append the number '0' for (36 * 11) times
            //
            // FURTHERMORE: I need to revisit calcuating the character width, this is somewhat of an early
            // way I found to get it, perhaps it isn't quite so involved.
            //
            sampleTextBuilder.push("abcdefghijklmnopqrstuvwxyz123456789");
        }
        // TODO: What does 'const' mean.
        measureElement.innerHTML = sampleTextBuilder.join("");

        this.characterWidth = measureElement.offsetWidth / (36 * 11);
        this.lineHeight = measureElement.offsetHeight;

        this.editorElement.removeChild(measureElement);
    }
}
