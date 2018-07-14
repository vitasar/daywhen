var getData = fetch('https://raw.githubusercontent.com/vitasar/daywhen/master/data/data.js').then(function(response){
    return response.text()
});
var getApi = fetch('https://raw.githubusercontent.com/vitasar/daywhen/master/src/index.js').then(function(response){
    return response.text()
});
Promise.all([getData,getApi]).then(function(values){
    eval(values[0]);
    eval(values[1]);
    handler(data);
});