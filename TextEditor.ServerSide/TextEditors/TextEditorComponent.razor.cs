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

    private IJSObjectReference? module;

    public void SetText(string text)
    {
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            module = await JS.InvokeAsync<IJSObjectReference>("import",
                "./TextEditors/TextEditorComponent.razor.js");

            var a = await module.InvokeAsync<string>("GreetingHelpers.sayHello");
        }
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (module is not null)
        {
            try
            {
                await module.DisposeAsync();
            }
            catch (JSDisconnectedException) // only necessary for server side applications
            {
            }
        }
    }
}
