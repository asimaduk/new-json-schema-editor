import React from 'react';
import './App.css';
import {JsonEditor as Editor} from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import axios from 'axios';
import secrets from './secrets';

const serverUrl = "http://localhost:8000/";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            file: null,
            showEditor: false,
            fileAfterEdit: null,
            downloading: false,
            saving: false,
            url:'', //https://support.oneskyapp.com/hc/en-us/article_attachments/202761727/example_2.json
            newFilename:'',
            isRemoteFile:false
        }
    }

    handleChange = (fileAfterEdit) => {
        this.setState({fileAfterEdit})
    }
    handleFileUpload = (event) => {
        const file = event.target.files[0];

        this.setState({file})
    }
    handleJsonDownload = () => {
        let { url } = this.state;
        url = url.trim();
        if(!url){
            alert('Provide url for json')
        }
        else {
            this.setState({downloading: true});

            if(url.indexOf('skkiper')){
                let headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
    
                let body = {};
                // http://app.skkiper.com:4000/documents/getDocumentTemplate
                const token = secrets.BEARER_TOKEN;

                headers['Authorization'] = `Bearer ${token}`;
                body['id'] = 10;

                axios.post(url, body, { headers })
                .then(async result => {
                    console.log('res.data',result.data);
                    
                    if(result.data){
                        const data = result.data;
                        let jsonStr = JSON.stringify(data);
                        const file = JSON.parse(jsonStr);
                        this.setState({file, isRemoteFile:true, showEditor: true})
                    }
                    else {
                        alert('Could not download file');
                        this.setState({downloading: false});
                    }
                })
                .catch(error=> {
                    console.log('download error',error);
                    alert('Error in downloading file. Check console for details')
                    this.setState({downloading: false});
                })
            }
            else {
                axios.get(url)
                    .then(async result => {
                        console.log('res.data',result.data);
                        
                        if(result.status === 200){
                            const data = result.data;
                            let jsonStr = JSON.stringify(data);
                            const file = JSON.parse(jsonStr);
                            this.setState({file, isRemoteFile:true, showEditor: true})
                        }
                        else {
                            alert('Could not download file');
                            this.setState({downloading: false});
                        }
                    })
                    .catch(error=> {
                        console.log('download error',error);
                        alert('Error in downloading file. Check console for details')
                        this.setState({downloading: false});
                    })
            }
        }
    }
    handleKeyUp = (event) => {
        const keyCode = event.keyCode;

        //using this to allow setState() to set the 'url' value in the scenario of pasting the url and hitting enter right away
        setTimeout(() => {
            if(keyCode === 13) {
                this.handleJsonDownload()
            }
        },500);
    }
    renderFileLoader = () => {
        const { downloading, url } = this.state;
        return (
            <div style={{padding:15}}>
                <input disabled={downloading} type="file" name="file" accept="application/JSON" onChange={this.handleFileUpload}/>
                <button disabled={downloading} type="button" className="btn btn-success btn-block" onClick={this.onClickHandler} style={{padding:10}}>Upload</button>
                <hr style={{marginTop:25}}/>
                <div style={{marginTop:20, width:'40%', display:'flex', flexDirection:'row'}}>
                    <input value={url} placeholder="Enter file url" type="text" name="url" style={{marginRight:20, width:300,outline:'none',padding:10}} onChange={(event) => this.setState({url: event.target.value})} onKeyUp={this.handleKeyUp} />
                    <button disabled={downloading} type="button" onClick={this.handleJsonDownload}>
                        {downloading ? 'Downloading...' : 'Download JSON'}
                    </button>
                </div>
            </div>
        )
    }
    onClickHandler = async () => {
        if(!this.state.file){
            alert('Please select file')
            return;
        }
        const data = new FormData()
        data.append('file', this.state.file);
        await axios.post(`${serverUrl}upload`, data).then(async res => {

            const url = `${serverUrl}getFile/${res.data.filename}`;
            const result = await axios.get(url);
            const data = result.data;
            let jsonStr = JSON.stringify(data);
            const file = JSON.parse(jsonStr);
            this.setState({file,filename:res.data.filename, showEditor: true})
        })
    }
    saveJson =async () => {
        let {filename:fileName,fileAfterEdit:content, isRemoteFile, newFilename} = this.state;
        if(!content){
            alert('Edit file before you save new version locally.');
            return;
        }
        else if(isRemoteFile && !newFilename){
            alert('Provide file name before you save new version locally.');
            return;
        }
        else if(newFilename){
            fileName = newFilename;
        }

        this.setState({saving: true})
        await axios.post(`${serverUrl}saveFile`, {content,fileName})
            .then(async res => {
                console.log(res);
                
                if(res.status === 200){
                    setTimeout(() => {
                        this.setState({saving:false})
                    }, 1000);
                }
                else {
                    alert('Failed to save file locally');
                    this.setState({saving:false})
                }
            })
    }

    saveToAPI = () => {
        let {filename:fileName,fileAfterEdit:content, isRemoteFile, newFilename} = this.state;

        if(!content){
            alert('Edit file before you post new version to API');
            return;
        }
        // else if(isRemoteFile && !newFilename){
        //     alert('Provide file name before you save new version locally.');
        //     return;
        // }
        // else if(newFilename){
        //     fileName = newFilename;
        // }

        let result = prompt('Are you sure you want to POST to the Dynamic API? Type "YES" to continue.');

        if(result === 'YES'){
            const serverUrl = 'http://app.skkiper.com:4000/documents/saveDocumentTemplate';
            const token = secrets.BEARER_TOKEN;
            const headers = {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        
            axios.post(serverUrl, { ...content }, { headers })
                .then(async result => {
                    if(result.status === 201){
                        this.setState({saving:false});
                        alert('File was created successfully')
                    }
                    else {
                        alert('Something happened '+ JSON.stringify(result.data))
                        this.setState({saving:false});
                    }
                })
                .catch(error=> {
                    alert('An error occurred. '+JSON.stringify(error.response.data));
                    this.setState({saving:false})
                })
        }
        else {
            alert('Did not POST to Dynamic API. Your response was: '+result)
        }
    }

    renderEditor = () => {
        const {file, saving, newFilename, isRemoteFile} = this.state;
        return (
            <div className="App">
                <Editor
                    value={file}
                    onChange={this.handleChange}
                />

                {saving ?
                    <p style={{width:200}}>Saving new document...</p>
                    :
                    <div style={{display:'flex',flexDirection:'row',padding:15}}>
                        {isRemoteFile && <input value={newFilename} placeholder="New local file name e.g sample.json" type="text" name="newFilename" style={{marginRight:20, width:250,outline:'none',padding:10}} onChange={(event) => this.setState({newFilename: event.target.value})} />}
                        <button onClick={this.saveJson} className="btn btn-success btn-block" style={{marginRight:15,cursor:'pointer',padding:10}}>Save Locally</button>
                        <button onClick={this.saveToAPI} className="btn btn-success btn-block" style={{cursor:'pointer',padding:10}}>Save To API</button>
                    </div>
                }
            </div>)
    }

    render() {
        const {showEditor} = this.state;
        if (showEditor) {
            return this.renderEditor();
        } else {
            return this.renderFileLoader()
        }
    }
}

export default App;
