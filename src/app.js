const { ipcRenderer } = require('electron')
// 키보드 입력
document.addEventListener('keydown', (event) => {
    if(event.keyCode==123){ //F12
        //메인프로세스로 toggle-debug 메시지 전송 (디버그 툴 토글시켜라)
        ipcRenderer.send('toggle-debug', 'an-argument')
    }
    else if(event.keyCode==116){ //F5
        //메인프로세스로 refresh 메시지 전송 (페이지를 갱신시켜라)
        ipcRenderer.send('refresh', 'an-argument')
    }
});
function reloadFiles(){
    ipcRenderer.send('reloadFile',{});
}
function fileSelect(){
    if($("#filelists").val()!=''){
        ipcRenderer.send('fileSelect',{"fileName":$("#filelists").val()});
        $(".fileInfoArea").fadeIn();
    }else{
        $(".fileInfoArea").fadeOut();
    }
}
function lineCalc(){
    if(eval($("#chunkLine").attr("minValue")) > eval($("#chunkLine").val())){
        alert('파일이 40개이상 생성되면 오류가 발생할수 있어 최소치로 변경합니다.');
        $("#chunkLine").val($("#chunkLine").attr("minValue"));
    }
    if($("#chunkLine").val()){
        var calcLineNum=Math.ceil(eval($("#selectFileLineNum").text())/eval($("#chunkLine").val()));
        $("#selectSplitFileCount").text(calcLineNum+"EA");
    }else{
        $("#selectSplitFileCount").empty();
    }
}


$("#reloadBtn").on("click",function(){
    reloadFiles();
});
ipcRenderer.on("returnData",function(event,params){

    if(params.pType=='reloadFile'){
        let $Lists=params.Lists;
        $("#filelists").empty();
        $("#filelists").append($("<option>").attr('value', '').text("선택해주세요"));
        $.each($Lists, function(i, item) {
            $("#filelists").append($("<option>").attr('value', item).text(item));
        });
    }else if(params.pType=='fileSelect'){
        var data=params.data;
        $("#selectFileName").text(data.fileName);
        $("#selectFileSize").text(data.fileSize);
        $("#selectFileLineNum").text(data.lineNum);
        console.log(data);
        console.log(data.minChunkLine);
        $("#chunkLine").attr("minValue",data.minChunkLine);
        lineCalc();
    }else if(params.pType=='createComp'){
        alert('생성완료');
        $("body").loading('stop');
        reloadFiles();
    }
});
$("#filelists").on("change",function(){
    fileSelect();
});
$("#chunkLine").on("change",function(){
    if($("#filelists").val()){
        lineCalc();
    }
});
$("#createFilesBtn").on("click",function (){
    $("body").loading({mesage:"NOW LOADING!"});
    ipcRenderer.send('chunkFile',{"fileName":$("#filelists").val(),"chunkLine":$("#chunkLine").val()});
});
reloadFiles();

