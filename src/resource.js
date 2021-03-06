var superagent = require('superagent')

module.exports = function(options) {

    var cache = {}

    function packError(err, res) {
        if (!err && res.error) {
            err = res.error

            // use the server generated text instead of the superagent's default text

            if (res.body && res.body.message)
                err.message = res.body.message

            else if (res.text)
                err.message = res.text
        }

        return err
    }

    function fetch(identifier, cb) {
        superagent
            .get('/videomail/' + identifier + '/snapshot')
            .set('Accept', 'application/json')
            .set(options.SITE_NAME_LABEL, options.siteName)
            .timeout(options.timeouts.connection)
            .end(function(err, res) {

                err = packError(err, res)

                if (err)
                    cb(err)
                else {
                    var videomail = res.body

                    if (options.cache)
                        cache[identifier] = videomail

                    cb(null, videomail)
                }
            })
    }

    this.get = function(identifier, cb) {
        if (options.cache && cache[identifier])
            cb(null, cache[identifier])
        else
            fetch(identifier, cb)
    }

    this.post = function(videomail, cb) {
        var queryParams = {}
        queryParams[options.SITE_NAME_LABEL] = options.siteName

        superagent
            .post(options.baseUrl + '/videomail/')
            .query(queryParams)
            .send(videomail)
            .timeout(options.timeout)
            .end(function(err, res) {

                err = packError(err, res)

                if (err)
                    cb(err)
                else {
                    if (options.cache)
                        cache[videomail.alias] = res.body.videomail

                    cb(null, res.body.videomail, res.body)
                }
            })
    }
}
