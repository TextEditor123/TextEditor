using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace TextEditor.ServerSide.TextEditors;

/// <summary>
/// Use '@ref="_textEditorComponent"',
/// then invoke the various public methods with the UI synchronization context (or ComponentBase.InvokeAsync(...), etc...).
/// </summary>
public partial class TextEditorComponent : ComponentBase, IAsyncDisposable
{
    [Inject]
    private IJSRuntime JS { get; set; } = null!;
    
    private static int ID_SOURCE;

    private IJSObjectReference? _module;
    private IJSObjectReference? _myJsObjectInstance;
    private DotNetObjectReference<TextEditorComponent>? _dotNetObjectReference;

    private TextEditorModel _model = new();

    private int _id;
    private string _htmlId = null!;

    //private bool _myJsObjectInstanceInitializedSuccessfully;
    //private int _itemHeight;
    //private int _totalCount;

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
            // Load the isolated JS module
            _module = await JS.InvokeAsync<IJSObjectReference>("import", "./TextEditors/TextEditorComponent.razor.js");
            _myJsObjectInstance = await _module.InvokeConstructorAsync("TextEditor", _htmlId, _dotNetObjectReference);
        }
    }

    [JSInvokable]
    public void OnKeyDown(string key)
    {
        _model.Builder.Append(key);
        StateHasChanged();
    }
    
    [JSInvokable]
    public Task InserText_ByteArray(int positionIndex, byte[] byteArray)
    {
        int insertOffset = 0;
        for (int i = 0; i < byteArray.Length; i++)
        {
            if (byteArray[i] != '\0')
                _model.Builder.Insert(positionIndex + insertOffset++, (char)byteArray[i]);
        }
        
        StateHasChanged();
        return Task.CompletedTask;
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (_module is not null || _myJsObjectInstance is not null || _dotNetObjectReference is not null)
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
