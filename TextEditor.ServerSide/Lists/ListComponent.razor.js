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

        let cursorElement = null;
        if (listChildrenContainerElement.children.length == 0) {
            this.initializedSuccessfully = false;
            return;
        }
        cursorElement = listChildrenContainerElement.children[0];

        let measureLineHeightElement = document.createElement('div');
        // This is a copy and pasted example from dev tools of just a text render fragment
        measureLineHeightElement.innerHTML = "<!--!-->wwwe3w5r.vgc jmfgv034.wno<!--!--><!--!--><!--!--><button class=\"btn btn-danger\">Delete</button>";


        this.initializedSuccessfully = true;

        listChildrenContainerElement.addEventListener('click', event => {
            let parentBoundingClientRect = listChildrenContainerElement.getBoundingClientRect();
            let relativeY = event.clientY - parentBoundingClientRect.top;
            let indexClicked = -1;
            for (let i = 0; i < listChildrenContainerElement.children.length; i++) {
                let childElement = listChildrenContainerElement.children[i];
                let childBoundingClientRect = childElement.getBoundingClientRect();
                let relativeChildTop = childBoundingClientRect.top - parentBoundingClientRect.top;
                if (relativeY >= relativeChildTop && relativeY < relativeChildTop + childBoundingClientRect.height) {
                    // If the state is invalid a div with solely a text node is displayed.
                    // ... I'm not sure whether a text node would be in the '.children' property.
                    if (childElement.children.length > 0) {
                        let buttonElement = childElement.children[childElement.children.length - 1];
                        let buttonBoundingClientRect = buttonElement.getBoundingClientRect();
                        if (event.clientX >= buttonBoundingClientRect.left && event.clientX < buttonBoundingClientRect.left + buttonBoundingClientRect.width &&
                            event.clientY >= buttonBoundingClientRect.top && event.clientY < buttonBoundingClientRect.top + buttonBoundingClientRect.height) {

                            indexClicked = i;
                        }
                    }
                    break;
                }
            }
            this.dotNetObjectReference.invokeMethodAsync("OnClick", indexClicked);
        });

        cursorElement.className = 'list-component-cursor';
    }
}