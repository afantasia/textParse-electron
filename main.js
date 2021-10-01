const {app, BrowserWindow, ipcMain } = require('electron')
const fs=require("fs");
const path=require("path");
let win;
const PRODUCT_TYPE="STAGE";//.env 파일 로드는 차후에 확인하는걸로 하고 1차적으로만 처리할수있게 작업 #DEVEL 일경우 개발자도구를 활용할수있음
var rootPath = require('electron-root-path').rootPath;
if(!PRODUCT_TYPE){rootPath+="/../";}
function deleteFolderRecursive(path) {
  var files = [];
  if( fs.existsSync(path) ) {
    files = fs.readdirSync(path);
    files.forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
function numPad(n, size) {
  n = n + '';
  return n.length >= size ? n : new Array(size - n.length + 1).join('0') + n;
}

function formatByteSizeString(bytes, decimals = 2) {
  if (bytes === 0) {
    return '0 Byte';
  }
  const k = 1000;
  const dm = decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
Object.defineProperty(Array.prototype, 'chunk_inefficient', {
  value: function(chunkSize) {
    var array = this;
    return [].concat.apply([],
        array.map(function(elem, i) {
          return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
        })
    );
  }
});
function createWindow() {
  win = new BrowserWindow({
    width: PRODUCT_TYPE=="DEVEL" ? 1300 : 300,
    height: PRODUCT_TYPE=="DEVEL" ? 1480 : 480,
    webPreferences: {
      nodeIntegration: true
    },
    resizable: PRODUCT_TYPE=="DEVEL" ? true : false,
    autoHideMenuBar: false,
  })
  win.loadURL(`file://${__dirname}/index.html`)
  win.on('closed', () => {
    app.quit();
  })
}
function sendFrontData(params){
  params.path=rootPath;
  win.webContents.send('returnData',params);
}
//렌더러프로세스에서 보내는 메시지 처리
ipcMain.on('toggle-debug', (event, arg)=> {
  //디버그 툴 토글(on/off)
  if(PRODUCT_TYPE=="DEVEL"){
    win.webContents.toggleDevTools()
  }
});
ipcMain.on('refresh', (event, arg)=> {
  //페이지 새로고침은 남겨둔다.
  win.reload();
});
ipcMain.on('reloadFile', (event, params)=> {
  var Lists=fs.readdirSync(rootPath+"/").filter(el=>path.extname(el).toLowerCase()=='.txt');
  sendFrontData({'pType':"reloadFile",'Lists':Lists})
  //{'pType':"createComp",'data':data}
});
ipcMain.on('fileSelect', (event, params)=> {
  const fileInfo=fs.readFileSync(rootPath+"/"+params.fileName);
  const data={
    'fileName':params.fileName,
    'fileSize':formatByteSizeString(fileInfo.byteLength),
    'minChunkLine':Math.ceil((fileInfo.toString().split(/\r?\n/).length) / 40),//파일은 100개 이상 생성되지 않게 해야한다.
    'lineNum':fileInfo.toString().split(/\r?\n/).length,
  };

  sendFrontData({'pType':"fileSelect",'data':data})
});
ipcMain.on('chunkFile', (event, params)=> {
  const fileInfo=fs.readFileSync(rootPath+"/"+params.fileName);
  const fileAr=fileInfo.toString().split(/\r?\n/);
  const chunkAr=fileAr.chunk_inefficient(params.chunkLine);
  const prefix=path.parse(rootPath+"/"+params.fileName).name;
  const ext=path.parse(rootPath+"/"+params.fileName).ext;
  const dirPath=rootPath+"/"+prefix;
  const fillContent= {};
  const fillSize=chunkAr.length.toString().length+1;

  for (var i in chunkAr){
    fillContent[numPad(i,fillSize)]=chunkAr[i].join("\n");
  }

  if( fs.existsSync( dirPath ) ) {
    deleteFolderRecursive(dirPath);
  }
  fs.mkdirSync(dirPath,{recursive:true});
  for(var fileNum in fillContent){
    fs.writeFileSync(dirPath+"/"+prefix+"_"+fileNum+ext,fillContent[fileNum]);
  }
  data={
    'chunkAr':fillContent,
    'fillContent':fillContent,
  };
  returnData({'pType':"createComp",'data':data})
});

app.on('ready', createWindow);