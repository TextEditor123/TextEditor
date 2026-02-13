export class ListComponent {
    htmlId;
    initializedSuccessfully;
    dotNetObjectReference;
    itemHeight = 1; // no decimal places, >= 1
    cursorIndex;
    totalCount;
    countWellknownImmediateElements = 3;
    indexCursorImmediateElement = 0;
    indexVirtualizationImmediateElement = 1;
    indexChildrenContainerImmediateElement = 2;

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

    getListVirtualizationRequest() {
        let listElement = document.getElementById(this.htmlId);
        if (!listElement || listElement.children.length != this.countWellknownImmediateElements) return;

        return {
            Skip: Math.floor(listElement.scrollTop / this.itemHeight),
            Take: Math.ceil(listElement.offsetHeight / this.itemHeight),
        };
    }

    setTotalCount(totalCount) {
        this.totalCount = totalCount;
        if (this.cursorIndex >= this.totalCount) {
            this.setCursorIndex(this.totalCount == 0 ? 0 : this.totalCount - 1);
        }
    }

    setCursorIndex(cursorIndex) {
        if (this.cursorIndex == cursorIndex) return;

        this.cursorIndex = cursorIndex;

        let listElement = document.getElementById(this.htmlId);
        if (!listElement || listElement.children.length != this.countWellknownImmediateElements) return;

        let childrenContainerElement = listElement.children[this.indexChildrenContainerImmediateElement];
        if (!childrenContainerElement) return;

        let cursorElement = listElement.children[this.indexCursorImmediateElement];
        cursorElement.style.height = this.itemHeight + "px";
        cursorElement.style.top = this.cursorIndex * this.itemHeight + "px";
    }

    setItemHeight(itemHeight) {
        this.itemHeight = itemHeight;

        let listElement = document.getElementById(this.htmlId);
        if (!listElement || listElement.children.length != this.countWellknownImmediateElements) return;

        let cursorElement = listElement.children[this.indexCursorImmediateElement];
        cursorElement.style.height = this.itemHeight + "px";
    }

    registerHandles() {
        let listElement = document.getElementById(this.htmlId);
        if (!listElement || listElement.children.length != this.countWellknownImmediateElements) {
            this.initializedSuccessfully = false;
            return;
        }

        let cursorElement = listElement.children[this.indexCursorImmediateElement];

        let measureLineHeightElement = document.createElement('div');
        // This is a copy and pasted example from dev tools of just a text render fragment that was using C#:'Path.GetRandomFileName()' twice to generate text.
        measureLineHeightElement.innerHTML = "wwwe3w5r.vgc jmfgv034.wno<button class=\"btn btn-danger\">Delete</button>";
        listElement.appendChild(measureLineHeightElement);
        this.setItemHeight(Math.ceil(measureLineHeightElement.getBoundingClientRect().height));
        listElement.removeChild(measureLineHeightElement);
        if (this.itemHeight < 1) {
            this.initializedSuccessfully = false;
            return;
        }

        cursorElement.className = 'list-component-cursor';

        listElement.addEventListener('click', event => {
            let parentBoundingClientRect = listElement.getBoundingClientRect();
            let relativeY = event.clientY - parentBoundingClientRect.top;
            let indexClicked = -1;
            for (let i = 0; i < listElement.children.length; i++) {
                let childElement = listElement.children[i];
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

        listElement.addEventListener('keydown', event => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    if (this.cursorIndex < this.totalCount - 1) {
                        setCursorIndex(this.cursorIndex + 1);
                    }
                    break;
            }
        });

        this.initializedSuccessfully = true;
    }
}