/**
 *  Cauldron Integration
 * 
 *  Copyright 2024 Janus B. Kristensen, CAVI,
 *  Center for Advanced Visualization and Interacion, Aarhus University
 *    
 * MIT License:
 * Permission is hereby granted, free of charge, to any person obtaining a copy of 
 * this software and associated documentation files (the “Software”), to deal in 
 * the Software without restriction, including without limitation the rights to use, 
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the 
 * Software, and to permit persons to whom the Software is furnished to do so, 
 * subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all 
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
 * SOFTWARE.
 */

// Run when/if Cauldron is initialized
{
    let alreadyInitializedDelayLoader = false;
    EventSystem.registerEventCallback("Cauldron.OnOpen", async ()=>{
        if (!alreadyInitializedDelayLoader){
            console.log("Enabling additional MyWebstrates packages for Cauldron integration");
            alreadyInitializedDelayLoader = true;

            if (webstrate?.addSyncServer){
                MenuSystem.MenuManager.registerMenuItem("Cauldron.File.Sync", {
                    label: "Federation Servers...",
                    tooltip: "Automerge Sync Servers for sharing webstrates",
                    icon: IconRegistry.createIcon("mdc:cloud"),                
                    onAction: async (menuItem)=>{
                        let parent = menuItem.menu.context.cauldron.getPopupParent();        
                        await wpm.require("MWFederationEditor");
                        let editor = new FederationEditor(false);
                        editor.setTopLevelComponent(parent);
                        let dialog = new WebstrateComponents.ModalDialog(editor.html, {
                            title: "Federation Servers",
                            actions: {
                                "Close":{primary:true}
                            }
                        });
                        parent.appendChild(dialog.html);
                        dialog.open();       
                    }
                });        
                
                let shareSyncLinkMenu = MenuSystem.MenuManager.createMenu("MyWebstrate.ShareSyncLinks", {});
                let shareMap = {};
                MenuSystem.MenuManager.registerMenuItem("Cauldron.File.Sync", {
                    label: "Copy Shareable Link...",
                    icon: IconRegistry.createIcon("mdc:offline_share"),
                    onOpen: ()=>{
                        if (automerge?.rootDoc?.meta?.federations?.length>0){
                            automerge.rootDoc.meta.federations.forEach(server=>{
                                console.log("Adding",server);
                                if (!shareMap[server]){
                                    let item = shareSyncLinkMenu.addItem({
                                        label: server,
                                        tooltip: "Copy a shareable link to the clipboard",
                                        icon: IconRegistry.createIcon("mdc:copy"),                
                                        onAction: async (menuItem)=>{
                                            let link = window.location.origin+window.location.pathname;
                                            if (link.endsWith("/")) link = link.substring(0,link.length-1);
                                            link += "@"+server;
                                            navigator.clipboard.writeText(link);
                                        }
                                    });
                                    shareMap[server] = item;
                                }
                            });
                            return true;
                        } else {
                            return false;
                        }
                    },
                    submenu: shareSyncLinkMenu
                });                        
            }                
        }
    });    
}