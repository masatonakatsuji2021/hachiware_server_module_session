/**
 * ============================================================================================
 * Hachiware_Server_module_session
 * 
 * A module for cache management for each request user of the Web server package "hachiware_server".
 * 
 * License : MIT License. 
 * Since   : 2022.01.15
 * Author  : Nakatsuji Masato 
 * Email   : nakatsuji@teastalk.jp
 * HP URL  : https://hachiware-js.com/
 * GitHub  : https://github.com/masatonakatsuji2021/Hachiware_Server_module_session
 * npm     : https://www.npmjs.com/package/Hachiware_Server_module_session
 * ============================================================================================
 */

const tool = require("hachiware_tool");
const fs = require("fs");
const path = require("path");

 module.exports = function(conf, context){

    if(!conf.sessions){
        conf.sessions = {};
    }

    if(!conf.sessions.idName){
        conf.sessions.idName = "HSSID";
    }

    if(!conf.sessions.idLength){
        conf.sessions.idLength = 64;
    }

    if(!conf.sessions.idLimit){
        conf.sessions.idLimit = 3600;
    }

    if(!conf.sessions.idPath){
        conf.sessions.idPath = "/";
    }

    if(!conf.sessions.path){
        conf.sessions.path = "sessions";
    }

    const getCookie = function(req, name){
        return context.modules[conf._file].hachiware_Server_module_cookie.get(req, name);
    };

    const setCOokie = function(res, name, value, option){
        return context.modules[conf._file].hachiware_Server_module_cookie.set(res, name, value, option);
    };

    this.getId = function(req, res){
        
        var id = getCookie(req, conf.sessions.idName);

        if(id){
           return id;
        }

        if(req[conf.sessions.idName]){
            return req[conf.sessions.idName];
        }

        var newId = this.changeId(req, res);

        return newId;
    };

    this.changeId = function(req, res){

        var newId = tool.uniqId(conf.sessions.idLength, true);

        var opt = {
            limit: conf.sessions.idLimit,
            path: conf.sessions.idPath,
        };

        setCookie(res, conf.sessions.idName, newId, opt);
        req[conf.sessions.idName] = newId;

        return newId;
    };

    this.get = function(req, res, name){

        var id = this.getId(req, res);

        var filePath = conf.rootPath + "/" + conf.session.path + "/" + id;

        if(!fs.existsSync(filePath)){
            return null;
        }

        var data = fs.readFileSync(filePath).toString();

        try{
            data = JSON.stringify(data)
        }catch(error){
            data = {};
        }

        if(name){
            if(data[name]){
                return data[name];
            }
            else{
                return null;
            }
        }
        else{
            return data;
        }
    };

    this.set = function(req, res, name ,value, option){

        var id = this.getId(req, res);

        var data = this.get(req);

        if(!data){
            data = {};
        }

        var filePath = conf.rootPath + "/" + conf.session.path + "/" + id;

        data[name] = value;

        data = JSON.stringify(data);

        fs.mkdirSync(path.dirname(filePath),{
            recursive: true,
        });

        fs.writeFileSync(filePath, data);
    };

    this.delete = function(req, name){


    };

};