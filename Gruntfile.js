module.exports = function(grunt) {
  grunt.initConfig({
    // and here we do some cool stuff
    
    // read the json file
    pkg: grunt.file.readJSON('package.json'),
    
    log: {
        // this is the name of the project in package.json
        name: '<%= pkg.name %>',
        // the version of the project in package.json
        version: '<%= pkg.version %>'
    }
  });
  
  grunt.registerMultiTask('log', 'Log project details.', function() {     
    // because this uses the registerMultiTask function it runs grunt.log.writeln()     
    // for each attribute in the above log: {} object     
    grunt.log.writeln(this.target + ': ' + this.data);   
  });
};