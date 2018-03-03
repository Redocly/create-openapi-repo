#!/usr/bin/node
'use strict'
require('shelljs/global');
var fs = require('fs')
var stringifyObject = require('stringify-object');
var SwaggerSnippet = require('swagger-snippet')

//first regenerate combined file to ensure it is up to date.
exec('swagger-repo bundle -o ./web_deploy/swagger.json'); //this wants a single dot

//now load that file
var SwaggerFile = require('../web_deploy/swagger.json'); //this wants a double dot

var results = SwaggerSnippet.getSwaggerSnippets(SwaggerFile,
        [
        'perl_perl5',
        'c_libcurl', //(default)
        'csharp_restsharp', //(default)
        'go_native', //(default)
        'java_okhttp',
        'java_unirest', //(default)
        'javascript_jquery',
        'javascript_xhr', //(default)
        'node_native', //(default)
        'node_request',
        'node_unirest',
        'objc_nsurlsession', //(default)
        'ocaml_cohttp', //(default)
        'php_curl', //(default)
        'php_http1',
        'php_http2',
        'python_python3', //(default)
        'python_requests',
        'ruby_native', //(default)
        'shell_curl', //(default)
        'shell_httpie',
        'shell_wget',
        'swift_nsurlsession' //(default)
        ]);


results.forEach(function(result)
        {
        var path = result.url.replace(/http.*api\//,'').replace(/\//g,'@');
        const pretty = stringifyObject(result.snippets, { indent: '  ', singleQuotes: false });
        result.snippets.forEach(function(snippet)
                {
                var ext = '.txt';
                var lang = snippet.id;
                lang = lang[0].toUpperCase() + lang.substring(1); //uppercase first letter
                if(lang == 'Shell_curl') { ext = '.sh'; lang = 'curl'; }
                if(lang == 'Shell_wget') { ext = '.sh'; lang = 'wget'; }
                if(lang.substring(0,4) == 'Perl') { ext = '.pl'; }
                if(lang.substring(0,6) == 'Python') { ext = '.py'; }
                if(lang.substring(0,3) == 'Php') { ext = '.php'; }
                var dir = 'spec/code_samples/' + lang + '/' + path + '/';
                mkdir('-p',dir);
                fs.writeFile(dir + result.method.toLowerCase() + ext,snippet.content, (err) => {
                        if (err) 
                                {
                                console.log('ERROR WRITING: ' + dir + result.method.toLowerCase() + ext);
                                console.log(err);
                                console.log(process.cwd());
                                }
                        });
                });
        })

