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

    startEdit(cursor, editKind, editPosition, editLength) {
        cursor.editKind = editKind;
        cursor.editPosition = editPosition;
        cursor.editLength = editLength;
    }

    clearEdit(cursor) {
        cursor.editKind = EditKind.None;
        cursor.editPosition = 0;
        cursor.editLength = 0;
    }

    async finalizeEdit(cursor) {
        if (cursor.editLength < Cursor.GAP_BUFFER_SIZE) {
            cursor.gapBuffer[cursor.editLength] = '\0';
        }
        await this.dotNetObjectReference.invokeMethodAsync("InserText_ByteArray", cursor.editPosition, cursor.gapBuffer);

        this.clearEdit(cursor);
    }

    InsertCanBatch(cursor) {
        return cursor.editKind != EditKind.InsertLtr ||
            cursor.editLength >= Cursor.GAP_BUFFER_SIZE ||
            cursor.positionIndex !== cursor.editPosition + cursor.editLength;
    }

    

    async onKeydown(event) {
        //let cursorElement = this.editorElement.children[this.indexCursorImmediateElement];
        //let textElement = this.editorElement.children[this.indexTextImmediateElement];

        if (event.key.length === 1) {
            if (!this.InsertCanBatch(this.primaryCursor)) {
                if (this.primaryCursor.editKind != EditKind.None) {
                    await this.finalizeEdit(this.primaryCursor);
                }
                this.startEdit(cursor=this.primaryCursor, editKind=EditKind.InsertLtr, editPosition=this.primaryCursor.positionIndex, editLength=0);
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
