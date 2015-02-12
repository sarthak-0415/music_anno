
/**
 * Create a WaveSurfer instance.
 */
var wavesurfer = Object.create(WaveSurfer);
var csv_dict =[];
var oauth
var current_user
/**
 * Init & load. main function
 */
document.addEventListener('DOMContentLoaded', function () {
    localStorage.clear();   
    
    waversurfer_init_function();
    wavesurfer_setting_fucntion();
    anntologies_data_loading();
    authenticate_user();
    handle_auth();

    make_and_post_swt();

});

function make_and_post_swt(){
    swt_data = localStorage.regions
    swt_data_json = JSON.parse(swt_data)
    localStorage.clear();

    post_swt = []
    for(i=0 ;i<swt_data_json.length;i++){
        
        var user = current_user;
        var context = "music_anno"     // our context is fixed
        var url = $('#file-input').val()
        var resource = swt_data_json[i]
        
        var swt = {
            "who" : user,
            "what": context,
            "where" : url,
            "how" : resource
        }

        post_swt[i] = swt
    }

    $.ajax({
        url : swtstoreURL()+ endpoints.post + '?access_token=' + access_token,
        data : post_swt,
        type : "POST",
        success : function(data){
            console.log(data);
        }
    });
}


function userLoggedIn(username) {
    current_user = username
    var text = 'Signed in as <b><u>' + username+ '</u></b>';
    $('#signinview').html(text);
}

function userLoggedOut(){
    current_user = 'guest'
    $('#signinview').html('Logged out');
}

function handle_auth(){
    if(access_token) {
        $('#signinview').html('Signing you in..');
            $.ajax({
                url: swtstoreURL()+'/api/users/me?access_token='+
                access_token,
                success: function(data) {
                    userLoggedIn(data.username);
                },
                error: function() {
                    $('#signinview').html('Error signing in! Please try again');
            }
        });
    }
}

function authenticate_user(){
    oauth = new Oauth({
        app_id: app_id,
        endpoint: swtstoreURL() + endpoints.auth,
        redirect_uri: oauth_redirect_uri,
        scopes: 'email,sweet'
    });

    var signin = document.querySelector('#sign-in');

    signin.onclick = function(event){
        event.preventDefault();
       
        console.log('oauth.authorize');

        oauth.authorize();
        //console.log(a);
        return false;
    };
}

function waversurfer_init_function(){
    // Init wavesurfer
    wavesurfer.init({
        container: '#waveform',
        height: 100,
        scrollParent: true,
        normalize: true,
        waveColor     : 'violet',
        progressColor : 'purple',
        loaderColor   : 'purple',
        cursorColor   : 'navy'
        //minimap: true,
        //backend: 'AudioElement'
    });

    //Load file for wavesurfer
     //wavesurfer.load('http://www.archive.org/download/mshortworks_001_1202_librivox/msw001_03_rashomon_akutagawa_mt_64kb.mp3');
    wavesurfer.load('static/demo.wav');

    //waversurfer regions initiallize
    /* Regions */
    wavesurfer.enableDragSelection({
        color: randomColor(0.1)
    });
}

function wavesurfer_setting_fucntion(){

    wavesurfer.on('ready', function () {
        if (localStorage.regions) {
            console.log('in if');
            loadRegions(JSON.parse(localStorage.regions));
        } else {
            console.log('in else');
            // loadRegions(
            //     extractRegions(
            //         wavesurfer.backend.getPeaks(512),
            //         wavesurfer.getDuration()
            //     )
            // );
            /*
            wavesurfer.util.ajax({
                responseType: 'json',
                url: 'annotations.json'
            }).on('success', function (data) {
                console.log(data);
                loadRegions(data);
                saveRegions();
            });*/
        }
    });
    wavesurfer.on('region-click', function (region, e) {
        e.stopPropagation();
        // Play on click, loop on shift click
        e.shiftKey ? region.playLoop() : region.play();
    });
    wavesurfer.on('region-click', editAnnotation);
    wavesurfer.on('region-updated', saveRegions);
    wavesurfer.on('region-removed', saveRegions);
    wavesurfer.on('region-in', showNote);

    wavesurfer.on('region-play', function (region) {
        region.once('out', function () {
            wavesurfer.play(region.start);
            wavesurfer.pause();
        });
    });
   
    /* Toggle play/pause buttons. */
    var playButton = document.querySelector('#play');
    var pauseButton = document.querySelector('#pause');
    var loadButton = document.querySelector('#load');


    wavesurfer.on('play', function () {
        playButton.style.display = 'none';
        pauseButton.style.display = '';
    });

    wavesurfer.on('pause', function () {
        playButton.style.display = '';
        pauseButton.style.display = 'none';
    });

    loadButton.onclick = function(event) {
        var val = document.querySelector('#file-input').value;
        wavesurfer.load(val);
        console.log(val);
    };
}

function anntologies_data_loading(){
    var generateFormButton = document.querySelector('#genrateForm');
    generateFormButton.onclick = function(event){
        var csv_file = document.querySelector('#csv-file-input').value;
        //open file
        
        csv = "1,'raga','Todi'\n2,'raga','Aarabhi'\n3,'raga','Abhogi'\n4,'raga','Adana'\n5,'raga','Ahir Bhairav'\n6,'raga','Ahiri'\n224,'svar','P'\n225,'svar','R'\n226,'svar','d'\n227,'svar','g'\n228,'svar','M'\n229,'svar','m'\n230,'svar','n'\n231,'svar','r'";
        csv_dict = generateForm(csv);
        console.log(csv_dict);
        
        addType(csv_dict);
        localStorage.setItem("csv", JSON.stringify(csv_dict));
    };
}

function change_label(){
    var selected_element = document.getElementById("songtype").value;
    addLabel(csv_dict[selected_element])
   // console.log('got here!');
}

/**
* Generate form using csv file
*/
function generateForm(csv_data){
    
    var allTextLines = csv_data.split(/\r\n|\n/);
    //console.log(allTextLines);
    var lines = {};
    var tarr = [];

    var temp = allTextLines[0].split(',');
    var temp_key = temp[1];

    for (var i=0; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(','); 
        if(data[1] == temp_key){
            tarr.push(data[2]);
        }
        else{
           lines[temp_key] = tarr;
           temp_key = data[1];
           tarr = []; 
        }

    }
    lines[temp_key] = tarr;
    //console.log(lines);
    var str = JSON.stringify(lines);
    //console.log(str);
    return lines;
}

/**
 * Add type to the dropdown
 */
function addType(options) {
    selectId = 'songtype';
    
    for (var val in options) {
        var select = document.querySelector('#'+selectId);    
        //console.log(select);
        
        var node = document.createElement("option");
        node.id = val;
        node.setAttribute('value', val);
        node.textContent = val;
      
        //console.log(select);
        select.appendChild(node);
    }
}

/**
 * Add label to the dropdown
 */
function addLabel(options) {
    selectId = 'songlabel';
    var i = options.length - 1;
    var select = document.querySelector('#'+selectId);    
    while(select.childElementCount>0){
            select.removeChild(select.childNodes[0])
        }

    for (i=0; i <options.length; i++) {
        val = options[i]
     
        //console.log(select);
        var node = document.createElement("option");
        node.id = val;
        node.setAttribute('value', val);
        node.textContent = val;
      
        //console.log(select);
        //select.removeChild();
        select.appendChild(node);
    };
}

/**
 * Save annotations to localStorage.
 */
function saveRegions() {
    localStorage.regions = JSON.stringify(
        Object.keys(wavesurfer.regions.list).map(function (id) {
            var region = wavesurfer.regions.list[id];
            return {
                start: region.start,
                end: region.end,
                data: region.data
            };
        })
    );
}

/**
 * Load regions from localStorage.
 */
function loadRegions(regions) {
    regions.forEach(function (region) {
        region.color = randomColor(0.1);
        wavesurfer.addRegion(region);
    });
}

/**
 * Extract regions separated by silence.
 */
function extractRegions(peaks, duration) {
    // Silence params
    var minValue = 0.0015;
    var minSeconds = 0.25;

    var length = peaks.length;
    var coef = duration / length;
    var minLen = minSeconds / coef;

    // Gather silence indeces
    var silences = [];
    Array.prototype.forEach.call(peaks, function (val, index) {
        if (val < minValue) {
            silences.push(index);
        }
    });

    // Cluster silence values
    var clusters = [];
    silences.forEach(function (val, index) {
        if (clusters.length && val == silences[index - 1] + 1) {
            clusters[clusters.length - 1].push(val);
        } else {
            clusters.push([ val ]);
        }
    });

    // Filter silence clusters by minimum length
    var fClusters = clusters.filter(function (cluster) {
        return cluster.length >= minLen;
    });

    // Create regions on the edges of silences
    var regions = fClusters.map(function (cluster, index) {
        var next = fClusters[index + 1];
        return {
            start: cluster[cluster.length - 1],
            end: (next ? next[0] : length - 1)
        };
    });

    // Add an initial region if the audio doesn't start with silence
    var firstCluster = fClusters[0];
    if (firstCluster && firstCluster[0] != 0) {
        regions.unshift({
            start: 0,
            end: firstCluster[firstCluster.length - 1]
        });
    }

    // Filter regions by minimum length
    var fRegions = regions.filter(function (reg) {
        return reg.end - reg.start >= minLen;
    });

    // Return time-based regions
    return fRegions.map(function (reg) {
        return {
            start: Math.round(reg.start * coef * 10) / 10,
            end: Math.round(reg.end * coef * 10) / 10
        };
    });
}

/**
 * Random RGBA color.
 */
function randomColor(alpha) {
    return 'rgba(' + [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        alpha || 1
    ] + ')';
}

/**
 * Edit annotation for a region.
 */
function editAnnotation (region) {
    var form = document.forms.edit;
    form.style.opacity = 1;
    form.elements.start.value = Math.round(region.start * 10) / 10,
    form.elements.end.value = Math.round(region.end * 10) / 10;
    form.elements.note.value = region.data.note || '';
    form.elements.comment.value = region.data.comment || '';
    form.elements.songtype.value = region.data.songtype || '' ;
    form.elements.songlabel.value = region.data.songlabel || '';
    form.onsubmit = function (e) {
        e.preventDefault();
        region.update({
            start: form.elements.start.value,
            end: form.elements.end.value,
            data: {
                note: form.elements.note.value,
                comment: form.elements.comment.value,
                songtype: form.elements.songtype.value,
                songlabel: form.elements.songlabel.value
            }
        });
        form.style.opacity = 0;
    };
    form.onreset = function () {
        form.style.opacity = 0;
        form.dataset.region = null;
    };
    form.dataset.region = region.id;
}

/**
 * Display annotation.
 */
function showNote (region) {
    if (!showNote.el) {
        showNote.el = document.querySelector('#subtitle');
    }
    showNote.el.textContent = region.data.note || '–';
}

/**
 * Bind controls.
 */
GLOBAL_ACTIONS['delete-region'] = function () {
    var form = document.forms.edit;
    var regionId = form.dataset.region;
    if (regionId) {
        wavesurfer.regions.list[regionId].remove();
        form.reset();
    }
};

GLOBAL_ACTIONS['export'] = function () {
    window.open('data:application/json;charset=utf-8,' +
        encodeURIComponent(localStorage.regions));

    make_and_post_swt();
};

(function(window) {

  var Oauth = function(options) {
    // all necessary params provided?
    if(!options.hasOwnProperty('app_id') ||
       !options.hasOwnProperty('redirect_uri') ||
       !options.hasOwnProperty('scopes') ||
       !options.hasOwnProperty('endpoint')) {

      throw new Error('All of the - app_id, redirect_uri, scopes'+
                         ', endpoint - parameters must be provided');
      return;
    }
    // check for string types
    for(key in options) {
      if(typeof options[key] !== 'string') {
        throw new Error('All parameters should be of string type');
        return false;
      }
    }

    this.app_id = options.app_id;
    this.redirect_uri = options.redirect_uri;
    this.scopes = options.scopes.split(',');
    this.endpoint = options.endpoint;
    // if scopes returns empty array - that means scopes was not provided in
    // correct format - i.e comma seperated values
    if(!this.scopes.length) {
      throw new Error('`scopes` paramater must be a string of comma seperated scopes');
      return;
    }

    return this;
  };

  // callback function to click handler
  Oauth.prototype.login = function(event) {
    event.preventDefault();
    this.authorize();
  };

  Oauth.prototype.authorize = function() {
    var qs = 'scope=' + this.scopes.join('+') + '&' +
             'redirect_uri=' + encodeURIComponent(this.redirect_uri) + '&' +
             'response_type=code&'+
             'client_id=' + this.app_id;

    window.location.href = this.endpoint + '?' + qs;
  };

  window.Oauth = Oauth;
})(window);
