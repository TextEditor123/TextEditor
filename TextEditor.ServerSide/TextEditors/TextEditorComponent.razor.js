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
    gapParentElement;

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
            originalLine.style.visibility = "hidden";

            if (!this.virtualLineElement) {
                this.virtualLineElement = document.createElement('div');
                this.virtualLineElement.className = 'te_virtual-line';
                this.virtualLineElement.style.left = 0;
                this.virtualLineElement.style.top = 0;
            }

            this.virtualLineElement.innerHTML = originalLine.innerHTML;
            
            // TODO: columnIndex
            let goalColumnI = cursor.positionIndex;

            // The insertion is always preferential towards the left span in the case
            // that the insertion is at the end of one span, and the start of the next.
            //
            // Thus, the '0' index case needs to be explicitly written?
            //
            // (also needs to be explicit due to an empty line)
            //
            if (goalColumnI == 0) {
                if (this.virtualLineElement.children.length > 0) {
                    cursor.gapParentElement = this.virtualLineElement;
                    this.virtualLineElement.insertBefore(cursor.gapElement, this.virtualLineElement.children[0]);
                }
                else {
                    cursor.gapParentElement = this.virtualLineElement;
                    this.virtualLineElement.appendChild(cursor.gapElement);
                }
            }
            else {
                // ... you know what will cause your line index to change so you don't need
                // to consult with C# to know the line end positions.
                //
                // Part of how you know is the HTML itself for an ArrowRight case.
                //
                let runColumnI = 0;
                for (var i = 0; i < this.virtualLineElement.children.length; i++) {
                    let spanElement = this.virtualLineElement.children[i];
                    if (goalColumnI <= runColumnI + spanElement.textContent.length) {
                        // found the span that contains the to-be insertion split
                        // '<=' because end-of-line text insertion.
                        // (end of line but prior to the line ending itself)
                        // The line ending isn't written to the span, it is represented by the encompassing div itself.


                        //this.virtualLineElement

                        if (runColumnI == runColumnI + spanElement.textContent.length) {
                            if (i < this.virtualLineElement.children.length - 1) {
                                cursor.gapParentElement = this.virtualLineElement;
                                this.virtualLineElement.insertBefore(cursor.gapElement, this.virtualLineElement.children[i + 1]);
                                break;
                            }
                            else {
                                // I said I would put the gapElement within the existing span
                                // to inherit the syntax highlighting but this way works better to start with.
                                //
                                cursor.gapParentElement = this.virtualLineElement;
                                this.virtualLineElement.appendChild(cursor.gapElement);
                                break;
                            }
                        }
                        else {
                            let relativeColumnI = spanElement.textContent.length - runColumnI;
                            let aaaText = spanElement.textContent.substring(0, relativeColumnI + 1);
                            let bbbText = spanElement.textContent.substring(relativeColumnI + 1);
                            spanElement.innerHTML = '';

                            let aaaElement = document.createElement('span');
                            aaaElement.innerHTML = aaaText;
                            this.virtualLineElement.appendChild(aaaElement);

                            cursor.gapParentElement = spanElement;
                            this.virtualLineElement.appendChild(cursor.gapElement);

                            let bbbElement = document.createElement('span');
                            bbbElement.innerHTML = bbbText;
                            this.virtualLineElement.appendChild(bbbElement);

                            this.virtualLineElement.removeChild(spanElement);

                            break;
                        }
                        break;
                    }
                    else {
                        runColumnI += spanElement.textContent.length;
                    }
                }
            }
        }

        this.editorElement.appendChild(this.virtualLineElement);
    }

    removeVirtualLine(cursor) {
        let textElement = this.editorElement.children[this.indexTextImmediateElement];
        if (cursor.lineIndex < textElement.children.length) {
            //textElement.children[cursor.lineIndex].style.visibility = "";
            textElement.children[cursor.lineIndex].style.visibility = "unset";
        }
        if (cursor.gapParentElement) {
            cursor.gapParentElement.removeChild(cursor.gapElement);
            cursor.gapParentElement = null;
        }
        cursor.gapElement.innerHTML = '';
        this.virtualLineElement.innerHTML = '';
    }

    clearEdit(cursor) {
        /*
        // TODO: If this removeVirtualLine was already called from finalizeEdit you don't run it here
        if (cursor.editKind === EditKind.InsertLtr) {
            this.removeVirtualLine(cursor);
        }
        */
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
        /*if (cursor.editKind === EditKind.InsertLtr) {
            this.removeVirtualLine(cursor);
        }
        */
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
