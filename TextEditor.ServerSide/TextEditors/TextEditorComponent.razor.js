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
}

export class TextEditor {
    htmlId;
    dotNetObjectReference;
    initializedSuccessfully;
    countWellknownImmediateElements = 3;
    indexCursorImmediateElement = 0;
    indexVirtualizationImmediateElement = 1;
    indexTextImmediateElement = 2;
    primaryCursor = new Cursor();
    editorElement = null;

    constructor(htmlId, dotNetObjectReference) {
        this.htmlId = htmlId;
        this.dotNetObjectReference = dotNetObjectReference;

        this.registerHandles();
    }

    getInitializedSuccessfully() {
        return this.initializedSuccessfully;
    }

    async finalizeEdit(cursor) {
        if (cursor.editLength < Cursor.GAP_BUFFER_SIZE) {
            cursor.gapBuffer[cursor.editLength] = '\0';
        }
        await this.dotNetObjectReference.invokeMethodAsync("InserText_ByteArray", cursor.editPosition, cursor.gapBuffer);

        cursor.editKind = EditKind.None;
        cursor.editLength = 0;
        cursor.editPosition = 0;
    }

    async onKeydown(event) {
        //let cursorElement = this.editorElement.children[this.indexCursorImmediateElement];
        //let textElement = this.editorElement.children[this.indexTextImmediateElement];

        if (event.key.length === 1) {

            if (this.primaryCursor.editKind != EditKind.InsertLtr ||
                this.primaryCursor.editLength >= Cursor.GAP_BUFFER_SIZE ||
                this.primaryCursor.positionIndex !== this.primaryCursor.editPosition + this.primaryCursor.editLength) {

                if (this.primaryCursor.editKind != EditKind.None) {
                    await this.finalizeEdit(this.primaryCursor);
                }

                this.primaryCursor.editKind = EditKind.InsertLtr;
                this.primaryCursor.editLength = 0;
                this.primaryCursor.editPosition = this.primaryCursor.positionIndex;
            }
            
            this.primaryCursor.gapBuffer[this.primaryCursor.editLength] = event.key.codePointAt(0);
            this.primaryCursor.editLength++;
            this.primaryCursor.positionIndex++;
        }
    }

    registerHandles() {
        this.editorElement = document.getElementById(this.htmlId); 
        if (!this.editorElement || this.editorElement.children.length != this.countWellknownImmediateElements) {
            this.initializedSuccessfully = false;
            return;
        }

        this.editorElement.addEventListener('keydown', this.onKeydown.bind(this));

        this.initializedSuccessfully = true;
    }
}
