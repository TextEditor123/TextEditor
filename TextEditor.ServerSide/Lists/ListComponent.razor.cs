using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace TextEditor.ServerSide.Lists;

/// <summary>
/// The internal @key is each individual entry,
/// thus you cannot contain duplicates in the list
/// or an exception will be thrown for a duplicate key.
/// 
/// Renders an HTML "list" from an IEnumerable.
/// 
/// Use '@ref="_listComponent"' to capture a reference.
/// Then invoke 'SetItems()'.
/// </summary>
public partial class ListComponent<TItem> : ComponentBase, IAsyncDisposable
{
    [Inject]
    private IJSRuntime JS { get; set; } = null!;

    private IJSObjectReference? _module;
    private IJSObjectReference? _myJsObjectInstance;
    /// <summary>
    /// Hmmm I wonder if I can get rid of this one.
    /// </summary>
    private DotNetObjectReference<ListComponent<TItem>>? _dotNetObjectReference;

    /*
     * One can as well use a Blazor Parameter '[Parameter] public IEnumerable<TItem>? Items { get; set; }'
     * But the behavior slightly differs.
     * 
     * Google AI Overview for "blazor parameter cause child to state has changed":
     * ---------------------------------------------------------------------------
     * For reference types (complex objects like classes, lists, or delegates),
     * Blazor generally assumes the object might have changed internally and triggers a re-render of the child component by default,
     * even if the reference itself is the same. This ensures the UI reflects any potential changes within the mutable object.
     */

    /// <summary>
    /// Each user should access this _id via the UI Synchronization Context.
    /// Thus it is believed that even in a Server Side hosting scenario, that this is "thread safe"
    /// because from the perspective of each individual user, they will never see a duplicate id.
    /// 
    /// This id could technically wrap around to the negative values, then back to 0.
    /// So even if the first presumption holds true, given enough users... this perhaps is questionable.
    /// </summary>
    private static int ID_SOURCE;

    /// <summary>
    /// If you have the UI synchronization context,
    /// then editing this list is permitted.
    /// 
    /// Otherwise, editing this list without the UI synchronization context
    /// could result in an "enumeration was modified exception".
    /// </summary>
    private ItemsProviderDelegate? _itemsProviderDelegate;
    public delegate IEnumerable<TItem> ItemsProviderDelegate(int skip, int take);

    /// <summary>
    /// Blazor has a nice syntax for 'RenderFragment ChildContent' when it is a parameter.
    /// RenderFragment is however a delegate, and thus I'd prefer to avoid it being a parameter
    /// in order to not incur this component re-rendering when a parent component does.
    /// </summary>
    private RenderFragment<TItem>? _childContent;

    private Func<TItem, Task>? _deleteOnClickFunc;

    private int _id;
    private string _htmlId;

    private bool _myJsObjectInstanceInitializedSuccessfully;
    private int _itemHeight;
    private int _totalCount;

    protected override void OnInitialized()
    {
        _id = ID_SOURCE++;
        _htmlId = $"list-component-{_id}";
        _dotNetObjectReference = DotNetObjectReference.Create(this);
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            _module = await JS.InvokeAsync<IJSObjectReference>("import", "./Lists/ListComponent.razor.js");
            _myJsObjectInstance = await _module.InvokeConstructorAsync("ListComponent", _htmlId, _dotNetObjectReference);
            // TODO: Combine these js interop invocations to get all state necessary in one trip.
            _myJsObjectInstanceInitializedSuccessfully = await _myJsObjectInstance.InvokeAsync<bool>("getInitializedSuccessfully");
            if (_itemHeight > 0)
            {
                // An awkward scenario of InitializeAsync(...) needs to override the _itemHeight in OnAfterRenderAsync
                // if 'InitializeAsync(...)' is invoked prior to the first render of this component.
                await SetItemHeightAsync(_itemHeight);
            }
            else
            {
                _itemHeight = await _myJsObjectInstance.InvokeAsync<int>("getItemHeight");
            }

            StateHasChanged();
        }

        // Any high frequency events will either be
        // - handled entirely in JavaScript
        // - throttled
        // ... thus this: OnAfterRenderAsync, non-firstRender; logic is negligible.
        //
        if (_items is null && _itemCount != 0)
        {
            if (_myJsObjectInstance is not null)
            {
                await SetItemCount(0);
                await _myJsObjectInstance.InvokeVoidAsync("setItemCount", 0);
            }
        }
        else if (_items.Count != _itemCount)
        {
            await SetItemCount(_itemCount);
            
        }
    }

    /// <summary>
    /// The itemHeight is measured on the first render by putting a text node as the render fragment's resulting content.
    /// i.e.: Each node looks like this:<br/>
    /// ```<br/>
    /// Aaa Bbb [Delete]<br/>
    /// Ccc Ddd [Delete]<br/>
    /// Eee Fff [Delete]<br/>
    /// ```<br/>
    /// If you measure the height yourself, you can specify that value.
    /// This is necessary if you have a render fragment that has a height different to that of when a text node is used in place of it.
    /// 
    /// TODO: determine a way to get the initial measurement of any arbitrary render fragment.
    /// ...The issue is with the timing of it all.
    /// And I just don't feel like looking into this at the moment.
    /// </summary>
    public async Task InitializeAsync(
        IEnumerable<TItem>? items,
        RenderFragment<TItem>? childContent,
        Func<TItem, Task>? deleteOnClickFunc,
        int itemHeightOverride = 0)
    {
        _items = items;
        _childContent = childContent;
        _deleteOnClickFunc = deleteOnClickFunc;
        if (itemHeightOverride > 0)
        {
            if (_myJsObjectInstance is not null)
            {
                // There is "nothing" stopping someone from invoking InitializeAsync(...)
                // after the first render.
                //
                // If they do, and they intend to use 'itemHeightOverride',
                // then the else case of this conditional branch will NOT ever
                // see OnAfterRenderAsync with firstRender==true, thus the provided
                // itemHeightOverride would never be applied.
                await SetItemHeightAsync(itemHeightOverride, skipStateHasChangedInvocation: true);
            }
            else
            {
                // The component hasn't rendered yet.
                _itemHeight = itemHeightOverride;
            }
        }
        StateHasChanged();
    }

    public async Task SetItemHeightAsync(int itemHeight, bool skipStateHasChangedInvocation = false)
    {
        if (itemHeight <= 0)
            throw new ArgumentException("if (itemHeight <= 0)");

        if (_myJsObjectInstance is not null)
        {
            _itemHeight = itemHeight;
            await _myJsObjectInstance.InvokeVoidAsync("setItemHeight", _itemHeight);
        }

        if (!skipStateHasChangedInvocation)
            StateHasChanged();
    }

    public void SetItemsProviderDelegate(ItemsProviderDelegate? itemsProviderDelegate, int totalCount)
    {
        _itemsProviderDelegate = itemsProviderDelegate;
        _totalCount = totalCount;
        StateHasChanged();
    }
    
    /// <summary>
    /// The naming convention being broken here is quite awkward but I think I'd prefer to just call it what it is.
    /// 
    /// All public methods from the ListComponent type specifically will internally invoke 'StateHasChanged()'.
    /// Thus you do not have to explicitly invoke this method after any other public method.
    /// </summary>
    public void Public_StateHasChanged()
    {
        StateHasChanged();
    }

    /// <summary>
    /// The hosting choice (ServerSide / WASM / ...) for your Blazor app might not permit synchronous invocation,
    /// I believe that just means for those cases this will run asynchronously?
    /// </summary>
    [JSInvokable]
    public void OnClick(int indexClicked)
    {
        if (_items is null || _deleteOnClickFunc is null || indexClicked < 0)
            return;

        var index = 0;
        var success = false;
        var foundElement = default(TItem);
        foreach (var element in _items)
        {
            if (index == indexClicked)
            {
                success = true;
                foundElement = element;
                break;
            }
            else
            {
                ++index;
            }
        }

        if (success && foundElement is not null)
        {
            _deleteOnClickFunc.Invoke(foundElement);
            StateHasChanged();
        }
    }

    /// <summary>This method is purposefully not public (contrary to the pattern one might've expected based on the other methods).</summary>
    private ValueTask SetItemCount(int itemCount)
    {
        if (_myJsObjectInstance is not null)
        {
            return _myJsObjectInstance.InvokeVoidAsync("setItemCount", 0);
        }
        else
        {
            return ValueTask.CompletedTask;
        }
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (_module is not null || _myJsObjectInstance is not null)
        {
            try
            {
                if (_myJsObjectInstance is not null)
                {
                    await _myJsObjectInstance.DisposeAsync(); // Dispose the JS object instance
                }
                if (_module is not null)
                {
                    await _module.DisposeAsync(); // Dispose the module reference
                }
                if (_dotNetObjectReference is not null)
                {
                    _dotNetObjectReference.Dispose();
                }
            }
            catch (JSDisconnectedException) // only necessary for server side applications
            {
            }
        }
    }
}