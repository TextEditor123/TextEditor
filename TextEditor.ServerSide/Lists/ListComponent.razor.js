export class ListComponent {
    htmlId;
    initializedSuccessfully;
    dotNetObjectReference;

    constructor(htmlId, dotNetObjectReference) {
        this.htmlId = htmlId;
        this.dotNetObjectReference = dotNetObjectReference;

        this.registerHandles();
    }

    getInitializedSuccessfully() {
        return this.initializedSuccessfully;
    }

    registerHandles() {
        let listChildrenContainerElement = document.getElementById(this.htmlId);
        if (!listChildrenContainerElement) {
            this.initializedSuccessfully = false;
            return;
        }
        this.initializedSuccessfully = true;
        listChildrenContainerElement.addEventListener('click', event => {
            let parentBoundingClientRect = listChildrenContainerElement.getBoundingClientRect();
            let relativeY = event.clientY - parentBoundingClientRect.top;
            let indexClicked = -1;
            for (let i = 0; i < listChildrenContainerElement.children.length; i++) {
                let childBoundingClientRect = listChildrenContainerElement.children[i].getBoundingClientRect();
                let relativeChildTop = childBoundingClientRect.top - parentBoundingClientRect.top;
                if (relativeY >= relativeChildTop && relativeY < relativeChildTop + childBoundingClientRect.height) {
                    indexClicked = i;
                    break;
                }
            }
            this.dotNetObjectReference.invokeMethodAsync("OnClick", indexClicked);
        });
    }
}