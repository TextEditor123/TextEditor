export class TextEditor {
    htmlId;
    dotNetObjectReference;
    initializedSuccessfully;
    countWellknownImmediateElements = 3;
    indexCursorImmediateElement = 0;
    indexVirtualizationImmediateElement = 1;
    indexTextImmediateElement = 2;

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
            switch (event.key) {

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
            //     - Althought perhaps you could maintain a gap buffer in JavaScript.
            //     - Then the non-contiguous edits are sent via dotnet interop...
            //     - Interestingly, if you did this you'd probably also with JavaScript just modify the text in the span,
            //           and immediately any new text inherits the contiguous syntax highlighting.
            //
            this.dotNetObjectReference.invokeMethodAsync("OnScroll", this.getListVirtualizationRequest());
        });

        this.initializedSuccessfully = true;
    }
}
