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
        return context.modules[conf._file].hachiware_server_module_cookie.get(req, name);
    };

    const setCookie = function(res, name, value, option){
        return context.modules[conf._file].hachiware_server_module_cookie.set(res, name, value, option);
    };

    /**
     * getId
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
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

    /**
     * changeId
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
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

    /**
     * get
     * @param {*} req 
     * @param {*} res 
     * @param {string} name 
     * @returns 
     */
    this.get = function(req, res, name){

        var id = this.getId(req, res);

        var filePath = conf.rootPath + "/" + conf.sessions.path + "/" + id;

        if(!fs.existsSync(filePath)){
            return null;
        }

        var data = fs.readFileSync(filePath).toString();

        try{
            data = JSON.parse(data)
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

    /**
     * set
     * @param {*} req 
     * @param {*} res 
     * @param {string} name 
     * @param {*} value 
     */
    this.set = function(req, res, name ,value){

        var id = this.getId(req, res);

        var data = this.get(req);

        if(!data){
            data = {};
        }

        var filePath = conf.rootPath + "/" + conf.sessions.path + "/" + id;

        if(value){
            data[name] = value;            
        }
        else{
            delete data[name];
        }

        data = JSON.stringify(data);

        fs.mkdirSync(path.dirname(filePath),{
            recursive: true,
        });

        fs.writeFileSync(filePath, data);
    };

    /**
     * delete
     * @param {*} req 
     * @param {*} name 
     * @returns 
     */
    this.delete = function(req, name){
        return this.set(req, res, name, null);
    };

    /**
     * frameworkAdapter
     * Hook to specify the method to provide to the framework
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    this.frameworkAdapter = function(req, res){

        var vm = this;

        var session = function(req, res){

            /**
             * getId
             * Gets the current session ID (HSSID).
             * @returns 
             */
            this.getId = function(){
                return vm.getId(req, res);
            };

            /**
             * changeId
             * Change to another session ID (HSSID).
             * Recommended for session hijacking protection.
             * @returns 
             */
            this.changeId = function(){
                return vm.changeId(req, res);
            };

            /**
             * get
             * Get session information.
             * @param {string} name Item name of session data
             * If not specified, all session data owned by the request user will be acquired.
             * @returns {*} 
             */
            this.get = function(name){
                return vm.get(req, res, name);
            };

            /**
             * set
             * Add or update session data.
             * @param {string} name Item name of session data to be added or updated.
             * @param {*} value Value of session data to add or update.
             * @returns 
             */
            this.set = function(name ,value){
                return vm.set(req, res, name ,value);
            };

            /**
             * delete
             * Delete session data
             * @param {string} name Session data item name to be deleted.
             * @returns 
             */ 
            this.delete = function(name){
                return vm.delete(req, name);
            };
        };

        return new session(req, res);
    };

};