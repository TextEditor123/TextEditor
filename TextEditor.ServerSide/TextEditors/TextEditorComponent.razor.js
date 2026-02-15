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
        // ...In C# they may or not be cached, but essentially the best thing is to just make a method if it is obviously sensible to do so.
        // So, in JavaScript should I do the same here?
        //
        editorElement.addEventListener('keydown', event => {
            switch (event.key) {

            }
        });

        this.initializedSuccessfully = true;
    }
}
