export class ListComponent {
    htmlId;
    initializedSuccessfully;
    dotNetObjectReference;
    itemHeight; // no decimal places, >= 1
    itemCount;

    constructor(htmlId, dotNetObjectReference) {
        this.htmlId = htmlId;
        this.dotNetObjectReference = dotNetObjectReference;

        this.registerHandles();
    }

    getInitializedSuccessfully() {
        return this.initializedSuccessfully;
    }

    getItemHeight() {
        return this.itemHeight;
    }

    setItemHeight(itemHeight) {
        this.itemHeight = itemHeight;

        let listChildrenContainerElement = document.getElementById(this.htmlId);
        if (!listChildrenContainerElement) return;

        if (listChildrenContainerElement.children.length == 0) return;

        let cursorElement = listChildrenContainerElement.children[0];
        cursorElement.style.height = this.itemHeight + "px";
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
        // This is a copy and pasted example from dev tools of just a text render fragment that was using C#:'Path.GetRandomFileName()' twice to generate text.
        measureLineHeightElement.innerHTML = "wwwe3w5r.vgc jmfgv034.wno<button class=\"btn btn-danger\">Delete</button>";
        listChildrenContainerElement.appendChild(measureLineHeightElement);
        this.setItemHeight(Math.ceil(measureLineHeightElement.getBoundingClientRect().height));
        listChildrenContainerElement.removeChild(measureLineHeightElement);
        if (this.itemHeight < 1) {
            this.initializedSuccessfully = false;
            return;
        }

        cursorElement.className = 'list-component-cursor';

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

        listChildrenContainerElement.addEventListener('keydown', event => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    if () {

                        // ... validate set items index range
                    }
                    break;
            }
        });

        this.initializedSuccessfully = true;
    }
}