(function () {
  const APPID = "c0ab6638";
  const API_SECRET = "ZjFlMmVhNmU2ZjBiODU5NTY1MGFkYmNh";
  const API_KEY = "b1a47be537657a504d9cfd2619c29df3";
  var isPart = false;
  var isNumber = false;
  var isEnglish = false;

  const unitNum = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
    11: 'eleven',
    12: 'twelve',
    13: 'thirteen',
    14: 'fourteen',
    15: 'fifteen',
    16: 'sixteen',
    17: 'seventeen',
    18: 'eighteen',
    19: 'nineteen',
    20: 'twenty',
    30: 'thirty',
    40: 'forty',
    50: 'fifty',
    60: 'sixty',
    70: 'seventy',
    80: 'eighty',
    90: 'ninety',
    100: 'hundred',
    1000: 'thousand',
    1000000: 'million',
    1000000000: 'billion',
    1000000000000: 'trillion',
    1000000000000000: 'quadrillion',
    1000000000000000000: 'quintillion',
    1000000000000000000000: 'sextillion',
  }
  var coreContext = {
    randNum: '',
    splitNum: '',
    strNum:  ''
  }
  
  const audioPlayer = new AudioPlayer("../../dist");
  let btnControl = document.getElementById("controll_tts");
  let btnStatus = "UNDEFINED"; // "UNDEFINED" "CONNECTING" "PLAY" "STOP"
  let ttsWS;

  // 控制播放键的显示状态
  function changeBtnStatus(status) {
    btnStatus = status;
    if (status === "UNDEFINED") {
      btnControl.innerText = "语音";
    } else if (status === "CONNECTING") {
      btnControl.innerText = "正在合成";
    } else if (status === "PLAY") {
      btnControl.innerText = "停止播放";
    } else if (status === "STOP") {
      btnControl.innerText = "重新播放";
    }
  }

  function getWebSocketUrl(apiKey, apiSecret) {
    var url = "wss://tts-api.xfyun.cn/v2/tts";
    var host = location.host;
    var date = new Date().toGMTString();
    var algorithm = "hmac-sha256";
    var headers = "host date request-line";
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
    var signature = CryptoJS.enc.Base64.stringify(signatureSha);
    var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    var authorization = btoa(authorizationOrigin);
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
    return url;
  }

  function encodeText(text, type) {
    if (type === "unicode") {
      let buf = new ArrayBuffer(text.length * 4);
      let bufView = new Uint16Array(buf);
      for (let i = 0, strlen = text.length; i < strlen; i++) {
        bufView[i] = text.charCodeAt(i);
      }
      let binary = "";
      let bytes = new Uint8Array(buf);
      let len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    } else {
      return Base64.encode(text);
    }
  }

  function connectWebSocket() {
    const url = getWebSocketUrl(API_KEY, API_SECRET);
    console.log(url)
    if ("WebSocket" in window) {
      ttsWS = new WebSocket(url);
    } else if ("MozWebSocket" in window) {
      ttsWS = new MozWebSocket(url);
    } else {
      alert("浏览器不支持WebSocket");
      return;
    }
    changeBtnStatus("CONNECTING");
    
    ttsWS.onopen = (e) => {
      audioPlayer.start({
        autoPlay: true,
        sampleRate: 16000,
        resumePlayDuration: 1000
      });
      changeBtnStatus("PLAY");
      var text =
        coreContext.strNum==''? "please create a number": coreContext.strNum;
       var tte = "UTF8";
      var params = {
        common: {
          app_id: APPID,
        },
        business: {
          aue: "raw",
          auf: "audio/L16;rate=16000",
          vcn: document.getElementById("vcn").value,
          speed: +document.getElementById("speed").value,
          volume: +document.getElementById("volume").value,
          pitch: +document.getElementById("pitch").value,
          bgs: 1,
          tte: "UTF8",
        },
        data: {
          status: 2,
          text: encodeText(text, tte),
        },
      };
      ttsWS.send(JSON.stringify(params));
    };
    ttsWS.onmessage = (e) => {
      let jsonData = JSON.parse(e.data);
      // 合成失败
      if (jsonData.code !== 0) {
        console.error(jsonData);
        changeBtnStatus("UNDEFINED");
        return;
      }
      audioPlayer.postMessage({
        type: "base64",
        data: jsonData.data.audio,
        isLastData: jsonData.data.status === 2,
      });
      if (jsonData.code === 0 && jsonData.data.status === 2) {
        ttsWS.close();
      }
    };
    ttsWS.onerror = (e) => {
      console.error(e);
    };
    ttsWS.onclose = (e) => {
      // console.log(e);
    };
  }

  // 获取训练等级
  function myLevel() {
    var level = parseInt(document.getElementById("level").value);
    console.log(level);
    //把字符串转换成数字
    return level;
  }

  // 切换数字显示形式
  function changeNumShow() {
    isPart = !isPart;
  }
  function initContext() {
    coreContext.randNum = '';
    coreContext.splitNum = '';
    coreContext.strNum = '';
  }

  // 生成数字
  function createNum() {
    let dim = myLevel();
    if(dim == 0){
      dim = Math.pow(10, Math.floor(Math.random()*10)+8);
    }
    return String(Math.floor(Math.random()*dim)/100);
  }

  // 数字=>辅助阅读
  function num2Part(num) {
    let sliceNum =  Array.from(num)
    let newFormalNum = []
    let count = 0
    let flagDot = false
    for (let i = 0; i < sliceNum.length; i++) {
      newFormalNum.push(sliceNum[sliceNum.length - i - 1]);
      
      if (flagDot) {
        count++
        if (count === 3 && i !== sliceNum.length - 1) {
          newFormalNum.push(',')
          count = 0;
        }
      }
      if (sliceNum[sliceNum.length - i - 1] === '.') {
        flagDot = true;
      }
    }
    return newFormalNum.reverse().join('');
  }

  // 数字=>英文
  function num2En(stringNum) {
    let intNum = stringNum.split('.')[0];
    let dotNum = stringNum.split('.')[1];
    let lenNum = intNum.length;
    let res = '';
    while (lenNum > 0) {
      if (lenNum >= 16) {
        res += "it's too big!!!";
        break;
      } else if (lenNum >=13) {
        let substr = intNum.slice(0, -12);
        res += partNum(substr) + ' ' + unitNum[1000000000000] + ' ';
        intNum = intNum.slice(-12);
        lenNum = 12;
      } else if (lenNum >= 10) {
        let substr = intNum.slice(0, -9);
        res += partNum(substr) + ' ' + unitNum[1000000000] + ' ';
        intNum = intNum.slice(-9);
        lenNum = 9;
      } else if (lenNum >= 7) {
        let substr = intNum.slice(0, -6);
        res += partNum(substr) + ' ' + unitNum[1000000] + ' ';
        intNum = intNum.slice(-6);
        lenNum = 6;
      } else if (lenNum >= 4) {
        let substr = intNum.slice(0, -3);
        res += partNum(substr) + ' ' + unitNum[1000] + ' ';
        intNum = intNum.slice(-3);
        lenNum = 3;
      } else {
        let substr = intNum;
        res += partNum(substr);
        lenNum = 0;
      }
    }
    if (dotNum!='' || dotNum!='.' || dotNum!=undefined) {
      res += ' dot ';
      for (let i = 0; i < dotNum.length; i++) {
        res += oneNum(dotNum[i]);
        if (i != dotNum-1) {
          res += ' ';
        }
      }
    }
    return res;
  }

  function partNum(substr) {
    let lenNum = substr.length;
    let res = '';
  
    if (lenNum === 1) {
      res = oneNum(substr);
    } else if (lenNum === 2) {
      if (substr[0] === '0') {
        res = oneNum(substr[1]);
      } else {
        res = twoNum(substr);
      }
    } else if (lenNum === 3) {
      if (substr[0] === '0' && substr[1] === '0' && substr[2] === '0') {
        res = oneNum('0');
      } else if (substr[0] === '0' && substr[1] === '0') {
        res = oneNum(substr[2]);
      } else if (substr[0] === '0') {
        res = twoNum(substr.slice(1));
      } else {
        res = threeNum(substr);
      }
    }
    return res;
  }

  function oneNum(substr) {
    return unitNum[parseInt(substr)];
  }

  function twoNum(substr) {
    if (substr[0] === '0') {
      return oneNum(substr[1]);
    } else if (substr[0] === '1') {
      return unitNum[10 + parseInt(substr[1])];
    } else {
      if (substr[1] === '0') {
        return unitNum[parseInt(substr[0]) * 10];
      } else {
        return unitNum[parseInt(substr[0]) * 10] + ' ' + oneNum(substr[1]);
      }
    }
  }

  function threeNum(substr) {
    if (substr[2] === '0' && substr[1] === '0') {
      return unitNum[parseInt(substr[0])] + ' ' + unitNum[100]
    } else {
      return unitNum[parseInt(substr[0])] + ' ' + unitNum[100] + ' and ' + twoNum(substr.slice(1));
    }
  }

  function screenclear() {
    isEnglish = false;
    isNumber = false;
    document.getElementById("numArea").innerHTML = '';
    document.getElementById("engArea").innerHTML = '';
  }

  var prompt = function(message, style, time) {
    style = (style === undefined) ? 'alert-success' : style;
    time = (time === undefined) ? 1200 : time;
    $('<div id="promptModal">')
        .appendTo('body')
        .addClass('alert ' + style)
        .css({
            "display": "block",
            "z-index": 99999,
            "left": ($(document.body).outerWidth(true) - 120) / 2,
            "top": ($(window).height() - 45) / 2,
            "position": "absolute",
            "padding": "20px",
            "border-radius": "5px",
            "color": "#fff",
            "background-color": "#009900",
            "opacity": 0.6,
            "font-size": "20px",
            "text-align": "center"
        })
        .html(message)
        .show()
        .delay(time)
        .fadeOut(10, function () {
            $('#promptModal').remove();
        });
  };

  document.getElementById("numArea").innerHTML = isNumber?(isPart ? coreContext.splitNum : coreContext.randNum):'';
  document.getElementById("engArea").innerHTML = isEnglish?coreContext.strNum:'';

  document.getElementById("numArea").onclick = function () {
    changeNumShow();
    document.getElementById("numArea").innerHTML = isNumber?(isPart ? coreContext.splitNum : coreContext.randNum):'';
  };

  document.getElementById("createNumber").onclick = function () {
    initContext();
    screenclear();
    coreContext.randNum = createNum();
    coreContext.splitNum = num2Part(coreContext.randNum);
    coreContext.strNum = num2En(coreContext.randNum);
    // window.alert('生成成功');
    changeBtnStatus("UNDEFINED");
    ttsWS?.close();
    audioPlayer.reset();
    prompt('生成成功', 'alert-success', 500);
  }
  
  document.getElementById("clear").onclick = function () {
    screenclear();
    changeBtnStatus("STOP");
    changeBtnStatus("UNDEFINED");
    prompt('清空成功', 'alert-success', 500);
  }

  document.getElementById("help").onclick = function () {
    confirm("帮助:\n1. 点击生成数字，生成一个随机的数字，!!点击数字区域内的数字可以切换显示形式辅助读数!!。\n2. 点击语音，可以进行语音播放。\n3. 点击清屏，可以清空数字和英文。\n4. 在左侧第三栏可调节发音参数。\n");
  }
  
  document.getElementById("showNumber").onclick = function () {
    isNumber = true;
    document.getElementById("numArea").innerHTML = isNumber?(isPart ? coreContext.splitNum : coreContext.randNum):'';
  }
  document.getElementById("showEnglish").onclick = function () {
    isEnglish = true;
    document.getElementById("engArea").innerHTML = isEnglish?coreContext.strNum:'';
  }


  audioPlayer.onPlay = () => {
    changeBtnStatus("PLAY");
  };
  audioPlayer.onStop = (audioDatas) => {
    console.log(audioDatas);
    btnStatus === "PLAY" && changeBtnStatus("STOP");
  };

  document.getElementById("speed").onchange =
    document.getElementById("volume").onchange =
    document.getElementById("pitch").onchange =
    document.getElementById("vcn").onchange =
      () => {
        changeBtnStatus("UNDEFINED");
        ttsWS?.close();
        audioPlayer.reset();
      };
  document.getElementById("controll_tts").onclick = function () {
    
    if (btnStatus === "UNDEFINED") {
      // 开始合成
      connectWebSocket();
    } else if (btnStatus === "CONNECTING") {
      // 停止合成
      changeBtnStatus("UNDEFINED");
      ttsWS?.close();
      audioPlayer.reset();
      return;
    } else if (btnStatus === "PLAY") {
      audioPlayer.stop();
    } else if (btnStatus === "STOP") {
      audioPlayer.play();
    }
  };
  document.getElementById("download_pcm").onclick = function () {
    const blob = audioPlayer.getAudioDataBlob("pcm")
    if (!blob) {
      return
    }
    let defaultName = new Date().getTime();
    let node = document.createElement("a");
    node.href = window.URL.createObjectURL(blob);
    node.download = `${defaultName}.pcm`;
    node.click();
    node.remove();
  };
  
  document.getElementById("download_wav").onclick = function () {
    const blob = audioPlayer.getAudioDataBlob("wav")
  if (!blob) {
    return
  }
    let defaultName = new Date().getTime();
    let node = document.createElement("a");
    node.href = window.URL.createObjectURL(blob);
    node.download = `${defaultName}.wav`;
    node.click();
    node.remove();
  };

})();