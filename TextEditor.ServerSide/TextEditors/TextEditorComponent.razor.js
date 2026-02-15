class Cursor {
    lineIndex = 0;
    columnIndex = 0;
    positionIndex = 0;
    gapBuffer = [];

    /*constructor() {
        this.lineIndex = 0;
        this.columnIndex = 0;
        this.positionIndex = 0;
    }*/
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
        editorElement.addEventListener('keydown', event => {
            /*switch (event.key) {

            }*/

            if (event.key.length === 1) {
                this.primaryCursor.gapBuffer.push(event.key);
                //this.dotNetObjectReference.invokeMethodAsync("OnKeyDown", event.key);
            }

            // TODO: Understand await with respect to the 'invokeMethodAsync'.
            //
            // Without await it presumably is fire and forget, but I've also tried
            // to make the lambda async and add await for previous cases and then the code stops working...
            //
            // If I want to move the cursor from JavaScript alone by checking the HTML then
            // it is probably very important that I get this timing correct.
            //
            // Lest Blazor update the UI as I'm moving the cursor in JavaScript?
            //
            // If you intend to move the cursor with JavaScript alone then the two problematic cases are:
            // - tab keys
            // - multicursor
            //     - Surely you woudn't want to invoke dotnet interop foreach multicursor when typing character by character?
            //     - Although perhaps you could maintain a gap buffer in JavaScript.
            //     - Then the non-contiguous edits are sent via dotnet interop...
            //     - Interestingly, if you did this you'd probably also with JavaScript just modify the text in the span,
            //           and immediately any new text inherits the contiguous syntax highlighting.
            //     - Blazor maintains the virtual DOM and from their perspective they wouldn't even know I modified the text with JavaScript
            //           while inserting text.
            //     - However it upon inserting the JavaScript gap buffer into C# would result in that line needing to be
            //           rendered again since the virtual DOM doesn't know the text is actually up to date.
            //     - If it only does a diff though it thinks it needs to insert the text, so it doubles up the text...
            //     - While in JavaScript you know where the text is going to be inserted, you could perhaps
            //           make a span alongside the existing one. Then you know when you move the gap buffer contents into C#
            //           to delete your JavaScript span.
            //     - You need to time the (I think it is called) "animation frame" so the user doesn't see the UI update without the text
            //           due to JavaScript removing it then Blazor makes it appear again.
            //
        });

        this.initializedSuccessfully = true;
    }
}
