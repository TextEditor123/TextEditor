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

    private IJSObjectReference? _module;
    private IJSObjectReference? _myJsObjectInstance;

    public async Task SetTextAsync(string text)
    {
        if (_myJsObjectInstance is not null)
        {
            await _myJsObjectInstance.InvokeAsync<string>("setText", text);
        }
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // Load the isolated JS module
            _module = await JS.InvokeAsync<IJSObjectReference>("import", "./TextEditors/TextEditorComponent.razor.js");
            _myJsObjectInstance = await _module.InvokeConstructorAsync("TextEditor", "aaa");
            var a = await _myJsObjectInstance.InvokeAsync<string>("getText");
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
            }
            catch (JSDisconnectedException) // only necessary for server side applications
            {
            }
        }
    }
}
