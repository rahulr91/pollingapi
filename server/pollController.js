const redis = require('redis')
const bodyparser = require('body-parser')
const formidable = require('formidable')
var client = redis.createClient({ port: 6379, host: '127.0.0.1', db: 1 })

module.exports = function(app) {
    app.post('/api/poll', function(req, res) {
        var form = new formidable.IncomingForm()
        form.parse(req, function(err, fields) {
            var question = fields['question']
            delete fields['question']
            var pollOptions = fields
            client.incr('pollId')
            client.get('pollId', function(err, reply) {
                var pollId = parseInt(reply)
                set(pollId, question, pollOptions)
                    // console.log(fields, question)
            })
            res.redirect('/')
        })
    })

    function set(pollId, question, pollOptions) {
        client.hset('poll:' + pollId, 'question', question, function(err, reply) {
            console.log('set ' + reply)
        })
        client.hset('poll:' + pollId, 'pollId', pollId, function(err, reply) {
            console.log('set ' + reply)
        })
        for (var element in pollOptions) {
            client.hset('pollOptions:' + pollId, pollOptions[element], 0, function(err, reply) {
                console.log('set ' + reply)
            })
        }
        client.hset('pollOptions:' + pollId, 'pollId', pollId, function(err, reply) {
            console.log('set ' + reply)
        })
        client.hset('pollOptions:' + pollId, 'pollCount', 0, function(err, reply) {
            console.log('set ' + reply)
        })
    }
    app.get('/api/polloptions/:id', function(req, res) {
        var pollId = req.params.id
        var obj = {}
        client.hgetall('poll:' + pollId, function(err, reply) {
            if (reply) {
                obj['question'] = reply['question']
                    // console.log(reply)
                client.hgetall('pollOptions:' + pollId, function(err, reply) {
                    obj['options'] = reply
                    res.send(obj)
                })
            } else {
                res.sendStatus(404)
            }
        })
    })

    app.get('/api/getpoll/', function(req, res) {
        client.keys('poll:*', function(err, reply) {
            res.send(reply)
        })
    })

    app.get('/api/getquestion/:id', function(req, res) {
        var id = req.params.id
        client.hgetall('poll:' + id, function(err, reply) {
            // console.log(reply)
            res.send(reply)
        })
    })
}
