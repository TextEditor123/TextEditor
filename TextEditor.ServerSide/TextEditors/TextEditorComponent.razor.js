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
        await this.dotNetObjectReference.invokeMethodAsync("InserText_ByteArray", cursor.gapBuffer);
        cursor.editLength = 0;
        cursor.editKind = EditKind.None;
    }

    registerHandles() {
        let editorElement = document.getElementById(this.htmlId);
        if (!editorElement || editorElement.children.length != this.countWellknownImmediateElements) {
            this.initializedSuccessfully = false;
            return;
        }

        let cursorElement = editorElement.children[this.indexCursorImmediateElement];
        let textElement = editorElement.children[this.indexTextImmediateElement];

        // TODO: What impact if any are there in relation to high frequency lambdas?...
        // ...In C# they may or may not be cached, but essentially the best thing is to just make a method if it is obviously sensible to do so.
        // So, in JavaScript should I do the same here?
        //
        /*
        Google AI Overview for: "JavaScript do frequently invoked lambdas cause more than one allocation"

        It sources mdn (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management#:~:text=This%20algorithm%20assumes%20the%20knowledge,collect%20all%20non%2Dreachable%20objects.):
        ------------------------------------------------------------------------------------------------------------------------------
        > Therefore, while the function definition itself doesn't get re-allocated on every call, the data and context associated with
          each invocation (especially for closures) do involve new memory allocation cycles. JavaScript's automatic garbage collection
          manages the cleanup of these temporary contexts when they are no longer reachable.
        ------------------------------------------------------------------------------------------------------------------------------
        */
        editorElement.addEventListener('keydown', async event => {
            /*switch (event.key) {

            }*/

            if (event.key.length === 1) {
                if (this.primaryCursor.editLength >= this.primaryCursor.gapBufferSize ||
                    this.primaryCursor.positionIndex !== this.primaryCursor.editPosition + this.primaryCursor.editLength) {

                    await this.finalizeEdit(this.primaryCursor);
                }
                else {
                    this.primaryCursor.gapBuffer[this.primaryCursor.editLength] = event.key.codePointAt(0);
                    this.primaryCursor.editLength++;
                }
            }
        });

        this.initializedSuccessfully = true;
    }
}
