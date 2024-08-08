/**
 *  Federation Editor
 *  Visual editor for managing sync server federation for a Webstrate
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

/**
 * Visual browser for managing sync server federation for a Webstrate
 */
window.FederationEditor = class FederationEditor {
    constructor(autoOpen=true) {
        let self = this;        
        try {
            this.assertSupported();
        } catch (ex){
            alert("One of the required dependencies is missing: "+ex);
            throw ex;
        }
        
        this.html = WebstrateComponents.Tools.loadTemplate("#federationEditorBase");
        this.itemTemplate = WebstrateComponents.Tools.loadTemplate("#federationEditorItem");
        this.servers = this.html.querySelector(".serverlist");
        
        wpm.require(["material-design-components","material-design-icons","ModalDialog","MenuSystem","MaterialMenu","MaterialDesignOutlinedIcons"]).then(()=>{
            mdc.autoInit(self.html);
            
            // Start showing the view
            this.updateServerView();
            if (autoOpen) this.openInBody();     
            this.setupAdderDialog();
            
            try {
                webstrate.on("syncServerAdded", ()=>{self.updateServerView()});
                webstrate.on("syncServerRemoved", ()=>{self.updateServerView()});
                //TODO: Clean these up again
            } catch (ex){
                console.log("Attempting to monitor sync server events but failed", x);
            }
        });
    }
    
    openInBody(){
        let parent = document.createElement("transient");
        document.body.appendChild(parent);            
        this.setTopLevelComponent(parent);
        parent.appendChild(this.html);
    }
    
    assertSupported(){
        if (!webstrate.getSyncServers) throw new Error("Missing federations getSyncServers");
        if (!webstrate.addSyncServer) throw new Error("Missing addSyncServer");
    }
    
    setupAdderDialog(){
        let self = this;
        let serverAdderTemplate = WebstrateComponents.Tools.loadTemplate("#federationEditorServerAdder");
        let addServerDialog = new WebstrateComponents.ModalDialog(
                serverAdderTemplate,
                {
                    "title":"Add Federation Server",
                    "actions": {
                            "cancel":{},
                            "add": {primary: true, mdcIcon: "add_link"}
                    }
                }
        );
        this.topLevelComponent.appendChild(addServerDialog.html);
        EventSystem.registerEventCallback('ModalDialog.Closing', function(evt) {
            if(evt.detail.dialog===addServerDialog && evt.detail.action === "add") {                
                let server = serverAdderTemplate.querySelector("#serveraddress");
                if (server && server.value.trim().length>0){
                    webstrate.addSyncServer(server.value);
                }                
            }
        });          
        
        this.html.querySelector(".add-server").addEventListener("click",()=>{
            addServerDialog.html.querySelector("#serveraddress").value = "";
            addServerDialog.open();
        });
        
    }
    
    async updateServerView(){
        let self = this;
        let newServers = webstrate.getSyncServers();
        
        // Remove old ones
        Array.from(this.servers.children).forEach(serverEl=>{
            if (serverEl.federationURL && !newServers.includes(serverEl.federationURL)){
                serverEl.remove();
            }
        });
        let existingServers = Array.from(this.servers.children).filter(entry=>entry.federationURL).map(entry=>entry.federationURL);
        
        // Add new ones
        newServers.forEach(server=>{
            if (!existingServers.includes(server)){
                let serverEl = WebstrateComponents.Tools.loadTemplate("#federationEditorItem");                
                serverEl.federationURL = server;
                serverEl.querySelector(".server-name").innerText = server;
                serverEl.querySelector(".server-status").innerText = "checking...";
                serverEl.querySelector(".server-icon").innerText = "network_check";
                serverEl.querySelector(".server-icon").style.color="grey";
                self.servers.insertBefore(serverEl,self.servers.firstChild);
                self.checkServer(server).then(()=>{
                    serverEl.querySelector(".server-status").innerText = "Connection Established";
                    serverEl.querySelector(".server-icon").innerText = "cloud_done";
                    serverEl.querySelector(".server-icon").style.color="green";
                },(ex)=>{
                    serverEl.querySelector(".server-status").innerText = ""+ex;
                    serverEl.querySelector(".server-icon").innerText = "cloud_off";                    
                    serverEl.querySelector(".server-icon").style.color="red";
                });
                if (webstrate.removeSyncServer){
                    serverEl.querySelector(".server-delete").addEventListener("click",()=>{
                        webstrate.removeSyncServer(server);
                    });
                } else {
                    serverEl.querySelector(".server-delete").remove();
                }
            }
        });
    }
    
    setTopLevelComponent(component){
        this.topLevelComponent = component;
    }        
    
    /**
     * Checks if a server accepts connections
     * @param {type} url
     * @returns true if server is working
     */
    checkServer(address){
        return new Promise((resolve, reject)=>{
            try {
                let ws = new WebSocket("wss://"+address);
                ws.onopen = function(e) {
                  resolve();
                  ws.close();
                };
                ws.onerror = function(error) {
                  reject("Websocket Error");
                };                    
            } catch (ex){
                reject(ex);
            }
        });
    }
};
