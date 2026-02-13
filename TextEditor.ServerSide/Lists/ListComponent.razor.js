export class ListComponent {
    htmlId;
    initializedSuccessfully;
    dotNetObjectReference;
    itemHeight = 1; // no decimal places, >= 1
    cursorIndex = 0;
    subFocusIndex = -1; // Each "node" has at minimum a delete button displayed.
                        // This index tracks whether focus is being given to a the list component,
                        // or a child element of the element that the cursorIndex targets.
                        // 
                        // -1: the list component has focus.
                        // otherwise, the index of the node's child elements that has focus.
    totalCount;
    countWellknownImmediateElements = 3;
    indexCursorImmediateElement = 0;
    indexVirtualizationImmediateElement = 1;
    indexChildrenContainerImmediateElement = 2;
    mostRecentSkip;

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

        this.mostRecentSkip = Math.floor(listElement.scrollTop / this.itemHeight);
        return {
            Skip: this.mostRecentSkip,
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
        this.subFocusIndex = -1;
        this.scrollCursorIntoView();
    }

    scrollCursorIntoView() {
        let listElement = document.getElementById(this.htmlId);
        if (!listElement || listElement.children.length != this.countWellknownImmediateElements) return;

        let childrenContainerElement = listElement.children[this.indexChildrenContainerImmediateElement];
        if (!childrenContainerElement) return;

        let cursorElement = listElement.children[this.indexCursorImmediateElement];
        cursorElement.style.height = this.itemHeight + "px";
        let cursorTop = this.cursorIndex * this.itemHeight;
        cursorElement.style.top = cursorTop + "px";

        if (cursorTop < listElement.scrollTop) {
            // scroll top
            listElement.scrollTop = cursorTop;
        }
        else if (cursorTop + this.itemHeight >= listElement.scrollTop + listElement.clientHeight) {
            // clientHeight is used purposefully so the scrollbar is accounted for.
            //
            // scroll bottom

            // I have to subtract something...
            // I'm lost but this works...
            // listElement.scrollBy(x = 0, y = );

            // oi I'm out of time this is working but I think it "works until it doesn't" kinda code
            // the < 0 is possible of ? or > sc?
            listElement.scrollTop += (cursorTop - listElement.scrollTop);
            // oh no I have 7 minutes until bedtime
        }

        if (document.activeElement !== listElement) {
            listElement.focus();
        }
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
        cursorElement.className = 'list-component-cursor';

        let measureLineHeightElement = document.createElement('div');
        // This is a copy and pasted example from dev tools of just a text render fragment that was using C#:'Path.GetRandomFileName()' twice to generate text.
        measureLineHeightElement.innerHTML = "wwwe3w5r.vgc jmfgv034.wno<button class=\"btn btn-danger\">Delete</button>";
        listElement.appendChild(measureLineHeightElement);
        let itemHeight = Math.ceil(measureLineHeightElement.getBoundingClientRect().height);
        listElement.removeChild(measureLineHeightElement);
        if (this.itemHeight < 1) {
            this.initializedSuccessfully = false;
            return;
        }
        this.setItemHeight(itemHeight);

        let childrenContainerImmediateElement = listElement.children[this.indexChildrenContainerImmediateElement];

        listElement.addEventListener('click', event => {
            let parentBoundingClientRect = listElement.getBoundingClientRect();
            let relativeY = event.clientY - parentBoundingClientRect.top;
            let indexClicked = -1;
            let deleteButtonWasClicked = false;
            for (let i = 0; i < childrenContainerImmediateElement.children.length; i++) {
                let childElement = childrenContainerImmediateElement.children[i];
                let childBoundingClientRect = childElement.getBoundingClientRect();
                let relativeChildTop = childBoundingClientRect.top - parentBoundingClientRect.top;
                if (relativeY >= relativeChildTop && relativeY < relativeChildTop + childBoundingClientRect.height) {
                    // If the state is invalid a div with solely a text node is displayed.
                    // ... I'm not sure whether a text node would be in the '.children' property.
                    indexClicked = i;
                    if (childElement.children.length > 0) {
                        let buttonElement = childElement.children[childElement.children.length - 1];
                        let buttonBoundingClientRect = buttonElement.getBoundingClientRect();
                        if (event.clientX >= buttonBoundingClientRect.left && event.clientX < buttonBoundingClientRect.left + buttonBoundingClientRect.width &&
                            event.clientY >= buttonBoundingClientRect.top && event.clientY < buttonBoundingClientRect.top + buttonBoundingClientRect.height) {

                            deleteButtonWasClicked = true;
                        }
                    }
                    break;
                }
            }
            if (deleteButtonWasClicked) {
                this.dotNetObjectReference.invokeMethodAsync("OnDelete", indexClicked);
            }
            else {
                this.dotNetObjectReference.invokeMethodAsync("OnClick", indexClicked);
            }
        });

        listElement.addEventListener('keydown', event => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    if (this.cursorIndex < this.totalCount - 1) {
                        this.setCursorIndex(this.cursorIndex + 1);
                    }
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    if (this.cursorIndex > 0) {
                        this.setCursorIndex(this.cursorIndex - 1);
                    }
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    // TODO: if the subFocusIndex is -1, give an outline to the node.
                    if (this.cursorIndex - this.mostRecentSkip >= childrenContainerImmediateElement.children.length) {
                        this.subFocusIndex = -1;
                        this.scrollCursorIntoView();
                        cursorElement.focus();
                        return;
                    }
                    let node = childrenContainerImmediateElement.children[this.cursorIndex - this.mostRecentSkip];
                    if (this.subFocusIndex >= node.children.length - 1) {
                        this.subFocusIndex = -1;
                        this.scrollCursorIntoView();
                        cursorElement.focus();
                    }
                    else {
                        let index = this.subFocusIndex + 1;
                        for (; index < node.children.length; index++) {
                            let child = node.children[index];
                            if (child.style.tabindex != 0) {
                                this.subFocusIndex = index;
                                child.focus();
                            }
                        }
                    }
                    break;
                case 'Enter':
                    if (event.target === listElement) {
                        event.preventDefault();
                        this.scrollCursorIntoView();
                        this.dotNetObjectReference.invokeMethodAsync("OnEnter", this.cursorIndex);
                    }
                    break;
            }
        });

        // Google AI overview for "javascript throttle trailing edge" generated the 'throttle(...)' function
        // ... I then asked how to invoke it and it gave me this:
        //
        // Using vanilla JS throttle with trailing edge support
        const handleScroll = this.throttle(() => {
            this.dotNetObjectReference.invokeMethodAsync("OnScroll", this.getListVirtualizationRequest());
        }, 90, { leading: true, trailing: true });

        listElement.addEventListener('scroll', handleScroll);

        this.initializedSuccessfully = true;
    }

    // Google AI overview for "javascript throttle trailing edge" generated this code:
    // It looks correct / correct-enough for a test run and see what happens.
    throttle(func, wait, options = { leading: false, trailing: true }) {
        let timer = null;
        let lastArgs;
        let context;

        const timeoutFunc = () => {
            if (options.trailing && lastArgs) {
                func.apply(context, lastArgs);
                lastArgs = null;
                timer = setTimeout(timeoutFunc, wait);
            } else {
                timer = null;
            }
        };

        return function (...args) {
            context = this;
            lastArgs = args;

            if (!timer) {
                if (options.leading) {
                    func.apply(context, args);
                }
                timer = setTimeout(timeoutFunc, wait);
            }
        };
    }
}