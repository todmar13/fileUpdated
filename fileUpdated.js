const fs = require('fs');
class fileUpdated {
    constructor(fn) {
        this.mtime = null;
        this.fn = fn;
        this.readFile();
        this.mtime = this.getmtime(fn);
    }
    getmtime()
    {
        var mtime = null;
        try {
        const stats = fs.statSync(this.fn);
           mtime = stats.mtime;
        }
        catch(err)
        {
            // will return null
        }
        return mtime;
    }
    readFile() {
        this.fj = null;
        let fc = null;
        try {
            fc = fs.readFileSync(this.fn);
        } catch(err) {
            return;     // file contents and json will be null
        }
        try {
        this.fj = JSON.parse(fc);
        }
        catch(err) {this.fj = err; console.log("JSON.Parse(fc) Error"); }
    }
    saveFile() {
        let data = JSON.stringify(this.fj, null, 2);
        fs.writeFileSync(this.fn,data);
    }
    updateFile() {
        let cmtime = this.getmtime(this.fn);
        if (cmtime==null)
            return;
        if (this.mtime!=null)
            if (cmtime>this.mtime)
        {
            this.mtime = cmtime;
            this.readFile(this.fn);
        }
    }
    getvalue(name) {
        this.updateFile();
        if (this.mtime!=null)
        {
            return this.fj[name];
        }
        return null;
    }
    getvalueorz(name) {
        let rv = this.getvalue(name);
        if (rv!=null)
            return rv;
        console.log("getvalueorz(name)"+":0");
        return 0;
    }
    setvalue(name,newvalue) {
        this.updateFile();
        if (this.mtime==null)        // does not exist. creating.
            this.fj = {};
        {
            this.fj[name] = newvalue;
        }
        this.saveFile();
    }
    getFileAll() {
        this.updateFile()
        return this.fj;
    }
}
module.exports = {fileUpdated};