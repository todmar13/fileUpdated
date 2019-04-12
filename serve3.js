//Require the 'net' module
// 20190321 convert 4 bytes to float and back again.
const net = require('net');
var binary = require('binary');
var fileUpdated = require('./fileUpdated').fileUpdated
function getFloat(cabloss)      // get float value from 32 bit 4 byte format
{
   var data = [(cabloss>>24)&0xff,(cabloss>>16)&0xff,(cabloss>>8)&0xff,cabloss&0xff,];
   var buf  = new ArrayBuffer(4);
   var view = new DataView(buf);
   data.forEach(function (b,i) { view.setUint8(i,b); });
   return view.getFloat32(0);
}
function floatTo32bit(fnum)
{
    var farr = new Float32Array(1);         // convert back to 4 bytes
    farr[0] = fnum;
    return (new Uint8Array(farr.buffer)).reverse();
}
class Bincon {
    constructor(initSize) {
        this.buf = Buffer.alloc(initSize,0);
        this.i = 0;
    }
    setpos(val) {
        this.i = val 
        return this;
    }
    word32lu(value) {
        this.buf[this.i++] = value&0xFF;
        this.buf[this.i++] = (value>>8)&0xFF
        this.buf[this.i++] = (value>>16)&0xFF
        this.buf[this.i++] = (value>>24)&0xFF
        return this;
    }
    nts8(value) {       // null terminated 8 bytes. last byte is 0.
        if (this.buf.length < (this.i+8))
        {
            let buf2 = Buffer.alloc(this.i+8);
            buf2 = this.buf;
            this.buf = buf2;
        }
        for (let cnt=0; cnt<8; cnt++) {
            if (value.length>cnt)
                this.buf[this.i++] = value.charCodeAt(cnt);
            else 
                this.buf[this.i++]=0;
        }
        return this;
    }
    word8u(value) {     // 8 bit byte
        this.buf[this.i++] = value&0xFF;
        return this;
    }
}
function send_NVSetup4111(vars,connection)
{
    let mybuf = new Bincon(48);
    let buffer = mybuf.word32lu(0).word32lu(4111).word32lu(48);
    mybuf.setpos(12).word32lu(vars.seq);
    // 4: 4111
    // 8: 4 byte size of buffer (14 byte minimum)
    // 24: 1:handheld, Button_Ant.Value <== 'Ant' value.
    //     0:Button_Ant.Value <== 'Tap'
    let gain1030=datafile.getvalueorz("Gain1030");
    let gain1090=datafile.getvalueorz("Gain1090");
    let cabloss=floatTo32bit(datafile.getvalueorz("CableLoss"));
    let longitude=getFloat(datafile.getvalueorz("longitude"));
    let latitude=getFloat(datafile.getvalueorz("latitude"));
    let handheld=datafile.getvalueorz("handheld");
    buffer = mybuf.setpos(20).word8u(cabloss[3]).word8u(cabloss[2]).word8u(cabloss[1]).word8u(cabloss[0]).word8u(1);
    mybuf.setpos(28).word32lu(gain1030).word32lu(gain1090).setpos(40).word32lu(longitude).word32lu(latitude);
    connection.write(mybuf.buf);
    console.log("Sending=NVSetup="+vars.seq+"============================");
    console.log("longitude:"+longitude+", latitude:"+latitude + "============================");
} 

var os = require("os")
var networkInterfaces = os.networkInterfaces();
console.log(networkInterfaces);
    
var hrstart = process.hrtime();
//Store the 'net.Server' object returned by 'net.createServer()'
const server = net.createServer();

var datafile = new fileUpdated("TR401x.json");
console.log(datafile.getFileAll())
process.exit()
//Add event listener for connection events
server.on('connection', connection => { console.log("connection") 
connection.on('data', data => {
    var vars = binary.parse(data)
        .word16lu('MsgTypeAdd')     // 0
        .word16lu('2,3')      // 2
        .word32lu('4-7')       // 4
        .word16lu('TestTxAdd')      // 8
        .word16lu('10,11')      // 10
        .word32lu('seq')       // 12
        .word32lu('pwdl')      // 16
        .word32lu('pwdh')      // 20-23
        .word32lu('24-27')
        .word32lu('28-31')      //1030
        .word32lu('32-35')      //1090
        .word32lu('36-39')      //
        .word32lu('40longitude')     //
        .word32lu('44latitude')      //
       .vars
    ;
    console.log(vars["seq"]+":seq,recv len:"+data.length+",msg:"+vars.TestTxAdd+",type:"+vars.MsgTypeAdd);
//    console.dir(vars);
    let str="";
    switch (vars.MsgTypeAdd)
    {
        case 2: str+="CONFIG_GET"; break;
        case 6: str+="Config_Get_Group"; break;
        case 7: str+="Config_Set_Group"; break;
    }
    switch(vars.TestTxAdd)
    {
        case 4101:str+=".ANTENNA_STATE 4101"; break;
        case 4105:str+=".HEALTH 4105"; break;
        case 4112:str+=".SYSINFO 4112"; break;
        case 4111:str+=".NVSetup 4111"; break;
        case 4114:str+=".FACTORYINFO 4114"; break;
        case 4115:str+=".HMAC_SHA1_PASS 4115"; break;
        case 2058:str+=".LISTEN_AUTO_UF19_TEST"; break;
    }
    console.log(str);
    if (str.includes(".ANTENNA_STATE")) {
        console.log(".ANTENNA_STATE 4101");
        let connection_e = datafile.getvalue("AntennaConnection",num);     // save in file
        if (connection_e==null)
            connection_e = 0;
        let mybuf = new Bincon(20);
        let buffer = mybuf.word32lu(0).word32lu(4101).word32lu(20).word32lu(0).word32lu(connection_e);
        mybuf.setpos(12).word32lu(vars.seq);        
        // Reply 0:0,0,0,0 this is status_add, RecState().
        // 4: 4101d, 05,10,00,00 this is reply to TestTxAdd at 8:.
        // 8: 4 byte size of buffer (14 byte minimum)
        // test
        connection.write(mybuf.buf)    
    }
    else
    if (str.includes(".SYSINFO")) {
        let mybuf = new Bincon(40);
        let buffer = mybuf.word32lu(0).word32lu(4112).word32lu(40).setpos(16).nts8("3.0rev").nts8("3.1fpga").nts8("3.2cpld");
        mybuf.setpos(12).word32lu(vars.seq);
        // Reply 0:0,0,0,0 this is status_add, RecState().
        // 4: 4101d, 05,10,00,00 this is reply to TestTxAdd at 8:.
        // 8: 4 byte size of buffer (14 byte minimum)
        // test
        connection.write(mybuf.buf);
    }
    else
    if (str.includes(".NVSetup")) {
        if (str.includes("Config_Set_Group")) {
            let cabloss = vars["pwdh"];
            /*
            var data = [(cabloss>>24)&0xff,(cabloss>>16)&0xff,(cabloss>>8)&0xff,cabloss&0xff,];
            console.log(data[0]+".."+data[1]+".."+data[2]+".."+data[3]);
            console.log(data);
            var buf  = new ArrayBuffer(4);
            var view = new DataView(buf);
            data.forEach(function (b,i) { view.setUint8(i,b); });
            var num = view.getFloat32(0);
            */
            var num = getFloat(cabloss);
            console.log(num);           // Float value from the 4 byte 
            datafile.setvalue("CableLoss",num);     // save in file
            var farr = new Float32Array(1);         // convert back to 4 bytes
            farr[0] = num;
            var barr = (new Uint8Array(farr.buffer)).reverse();
            console.log(barr);          // Back to the 4 byte identical to 'data'. data[0] is highest byte.
            let Gain1030 = vars["28-31"];
            datafile.setvalue("Gain1030",Gain1030);            
            let Gain1090 = vars["32-35"];
            datafile.setvalue("Gain1090",Gain1090);            
            let longitude = vars["40longitude"];
            var flong = getFloat(longitude);
            let latitude = vars["44latitude"];
            var flat = getFloat(latitude);
            datafile.setvalue("longitude",flong);
            datafile.setvalue("latitude",flat);
            console.log("Received=NVSetup======Config_Set_Group=============");
            send_NVSetup4111(vars,connection);   // return values that were set.  (Set returns a Get)
        }
        else {
            // NVSetup Config_Get_Group
            send_NVSetup4111(vars,connection);      // this is just a 'Get' command.
        }
    }
    else
    if (str.includes(".FACTORYINFO")) {
        console.log(".FACTORYINFO"+" Prep to send seq:" + vars.seq);
        var hrend = process.hrtime(hrstart);
        const hrs =  Math.round(hrend[0] / 3600); 
        let mybuf = new Bincon(29);
        let buffer = mybuf.word32lu(0).word32lu(4114).word32lu(29).setpos(20).word32lu(54321).setpos(24).word32lu(hrs);
        buffer = mybuf.setpos(12).word32lu(vars.seq);
        // 4: 4114
        // 8: 4 byte size of buffer (14 byte minimum)
        // 20: unit serial number
        // 24: hours of operation
        connection.write(mybuf.buf);
        console.log("Sending=FACTORYINFO="+vars.seq+"============================");    }
    else
    if (str.includes(".HEALTH")) {
        var hrend = process.hrtime(hrstart);
        const hrs =  Math.round(hrend[0] / 3600); 
        let mybuf = new Bincon(17);
        let buffer = mybuf.word32lu(0).word32lu(4105).word32lu(17);
        mybuf.setpos(12).word32lu(vars.seq);
        // 4: 4105
        // 8: 4 byte size of buffer (17 byte minimum)
        connection.write(mybuf.buf);
    }
    else
    if (str.includes(".HMAC_SHA1_PASS")) {
        let mybuf = new Bincon(17);
        let buffer = mybuf.word32lu(0).word32lu(4115).word32lu(17);
        mybuf.setpos(12).word32lu(vars.seq);        
        // 4: 4115
        // 8: 4 byte size of buffer (17 byte minimum)
        // 16-23 8 byte pwd
        let pwdl = vars.pwdl;
        let pwdh = vars.pwdh;
        let arr = [];
        for (let i=0;i<4;i++)
        {
            arr[i] = String.fromCharCode(pwdl&0xff);
            pwdl = pwdl>>8;
            //console.log("pwd:"+i+"="+arr[i]);
        }
        for (let i=0;i<4;i++)
        {
            arr[4+i] = String.fromCharCode(pwdh&0xff);
            pwdh = pwdh>>8;
            //console.log("pwd:"+(4+i)+"="+arr[4+i]);
        }
        var pwd = arr.join('');
        datafile.setvalue("HMAC_SHA1_PASS",pwd);
        console.log("Pwd:"+pwd);
        connection.write(mybuf.buf);
    }
	else
    if (str.includes(".LISTEN_AUTO_UF19_TEST")) {
        let mybuf = new Bincon(17);
        let buffer = mybuf.word32lu(0).word32lu(4115).word32lu(17);
        mybuf.setpos(12).word32lu(vars.seq);        
        // 4: 4105
        // 8: 4 byte size of buffer (17 byte minimum)
        connection.write(mybuf.buf);
    }
    else
    {
        console.log("---not handled---"+str);
        let mybuf = new Bincon(17);
        let unhcmd = vars.TestTxAdd;
        let buffer = mybuf.word32lu(0).word32lu(unhcmd).word32lu(17);
        mybuf.setpos(12).word32lu(vars.seq);        
        console.log(`replying:${unhcmd}`);
        connection.write(mybuf.buf);
    }
    /* demo:
    let mybuf = new Bincon(17);
    let buffer = mybuf.word32lu(0).word32lu(4101);
    // Reply 0:0,0,0,0 this is status_add, RecState().
    // 4: 4101d, 05,10,00,00 this is reply to TestTxAdd at 8:.
    // 8: 4 byte size of buffer (14 byte minimum)
    // test
    {
    let vars = binary.parse(mybuf.buf)
        .word32lu('First32bit')     // 0
        .word32lu('2nd32bit')       // 2
        .word32lu('3rd32bit')       // 4
        .word32lu('4th32bit')      // 8
        .vars
    console.dir(vars);    
    }
    */
    // end of test
    }
);

connection.on('disconnect', () => { console.log("disconnect"); } )
connection.on('close', () => { console.log("close"); } )

});

//Add event listener for close events
server.on('close', () => { 
    console.log(`Server disconnected`);
});

//Add listener for error events
server.on('error', error => { 
    console.log(`Error : ${error}`);
});
date = new Date();
console.log("listen on 8000 " + date.getFullYear()+(date.getMonth()+1).toString().padStart(2,'0')+date.getDate().toString().padStart(2,'0')+':'+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds());
//Listen for connections on port 4000
server.listen(8000);
