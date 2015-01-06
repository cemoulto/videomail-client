var UAParser        = require('ua-parser-js'),
    VideomailError  = require('./videomailError')

module.exports = function() {

    var firefoxDownload  = 'http://www.mozilla.org/firefox/update/',
        chromeDownload   = 'http://www.google.com/chrome/',
        chromiumDownload = 'http://www.chromium.org/getting-involved/download-chromium',
        browseHappyLink  = 'http://browsehappy.com',

        ua = new UAParser(window.navigator.userAgent).getResult(),

        isIOS         = ua.os.name === 'iOS',
        isChrome      = ua.browser.name === 'Chrome',
        isChromium    = ua.browser.name === 'Chromium',
        firefox       = ua.browser.name === 'Firefox',
        isIE          = /IE/.test(ua.browser.name),
        isSafari      = /Safari/.test(ua.browser.name),
        chromeBased   = isChrome || isChromium,

        videoType

    function getRecommendation() {
        var warning

        if (firefox)
            warning = '<a href="' + firefoxDownload + '" target="_blank">' +
                      'Upgrade Firefox</a> to fix this.'

        else if (isChrome)
            warning = '<a href="' + chromeDownload + '" target="_blank">' +
                      'Upgrade Chrome</a> to fix this.'

        else if (isChromium)
            warning = '<a href="' + chromiumDownload + '" target="_blank">' +
                      'Upgrade Chromium</a> to fix this.'

        else if (isIE)
            warning = 'Forget Internet Explorer!<br/>Better pick' +
                      ' <a href="' + firefoxDownload + '" target="_blank">Firefox</a>' +
                      ' or <a href="' + chromeDownload + '" target="_blank">Chrome</a>.'

        else if (isSafari)
            warning = 'Safari has no webcam support yet.<br/>Better pick' +
                      ' <a href="' + firefoxDownload + '" target="_blank">Firefox</a>' +
                      ' or <a href="' + chromeDownload + '" target="_blank">Chrome</a>.'

        return warning
    }

    function getUserMediaWarning() {
        var warning

        if (isIOS)
            warning = '<a href="http://caniuse.com/stream" target="_blank">' +
                      'iOS devices are unable to access video streams.' +
                      '</a> One day they will hopefully. Depends on Apple &hellip;'

        else
            warning = getRecommendation()

        if (!warning)
            warning = '<a href="http://caniuse.com/stream" target="_blank">Switch</a> ' +
                      'or ' + getBrowseHappyLink()

        return warning
    }

    function getBrowseHappyLink() {
        return '<a href="' + browseHappyLink + '" target="_blank">Upgrade browser</a>.'
    }

    function getPlaybackWarning() {
        var warning = getRecommendation()

        if (!warning)
            warning = getBrowseHappyLink()

        return warning
    }

    function canPlayType(video, type) {
        var canPlayType

        if (video.canPlayType)
            canPlayType = video.canPlayType('video/' + type)

        return canPlayType
    }

    this.canRecord = function() {
        var getUserMediaType = typeof navigator.getUserMedia

        return getUserMediaType !== "undefined" && getUserMediaType == 'function'
    }

    this.checkRecordingCapabilities = function() {
        var err

        if (!this.canRecord())
            err = new VideomailError('No webcam support', {
                explanation: getUserMediaWarning()
            })

        return err
    }

    this.checkPlaybackCapabilities = function(video) {
        var err,
            message

        if (!video)
            message = 'No HTML5 support for video tag!'
        else if (!this.getVideoType(video))
            message = 'No H264 nor webm support found.'

        if (message)
            err = new VideomailError(message, {
                explanation: getPlaybackWarning()
            })

        return err
    }

    this.checkBufferTypes = function() {
        var err

        if (typeof window.atob === 'undefined')
            err = new VideomailError('atob is not supported')

        else if (typeof window.ArrayBuffer === 'undefined')
            err = new VideomailError('ArrayBuffers are not supported')

        else if (typeof window.Uint8Array === 'undefined')
            err = new VideomailError('Uint8Arrays are not supported')

        return err
    }

    this.getVideoType = function(video) {

        if (!videoType) {

            //  there is a bug in canPlayType within chrome for mp4
            if (canPlayType(video, 'mp4') && !chromeBased)
                videoType = 'mp4'

            else if (canPlayType(video, 'webm'))
                videoType = 'webm'
        }

        return videoType
    }

    this.getNoAccessIssue = function() {
        var message = 'Cannot access webcam!',
            explanation

        if (this.isChromeBased())
            explanation = 'Click on the allow button above to grant access to your webcam.'

        else if (this.isFirefox())
            explanation = 'Please share your webcam under Firefox.'

        else
            explanation = 'Your operating system does not let your browser access your webcam.'

        return new VideomailError(message, {
            explanation: explanation
        })
    }

    this.isChromeBased = function() {
        return chromeBased
    }

    this.isFirefox = function() {
        return firefox
    }
}