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

    // TODO: You might have to overlay the edit, and target oh geez
    gapElement = null;

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
            if (!cursor.gapElement) {
                cursor.gapElement = document.createElement('div');
            }
            this.editorElement.appendChild(cursor.gapElement);
        }
    }

    clearEdit(cursor) {
        if (cursor.editKind === EditKind.InsertLtr) {
            this.editorElement.removeChild(cursor.gapElement);
            cursor.gapElement.innerHTML = '';
        }
        cursor.editKind = EditKind.None;
        cursor.editPosition = 0;
        cursor.editLength = 0;
    }

    // TODO: You might have to finalizeEdit onscroll. otherwise scrolling back into view the line Blazor will ???
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
        //let cursorElement = this.editorElement.children[this.indexCursorImmediateElement];
        //let textElement = this.editorElement.children[this.indexTextImmediateElement];

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
