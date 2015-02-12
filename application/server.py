from flask import Flask, session, request, make_response, url_for, redirect,\
    render_template, jsonify, abort
import requests
import json
from datetime import datetime, timedelta

import config


app = Flask(__name__)
app.config['SECRET_KEY'] = config.secret_key

@app.route("/")
def index():

    if 'auth_tok' in session:
        auth_tok = session['auth_tok']

        # check if it has expired
        oauth_token_expires_in_endpoint = config.swtstoreURL + '/oauth/token-expires-in'
        resp = requests.get(oauth_token_expires_in_endpoint)
        expires_in = json.loads(resp.text)['expires_in']

        check = datetime.utcnow() - auth_tok['issued']
        if check > timedelta(seconds=expires_in):
            print 'access token expired'
            auth_tok = {'access_token': '', 'refresh_token': ''}
        else:
            print 'access token did not expire'

    else:
        auth_tok = {'access_token': '', 'refresh_token': ''}

    return render_template('index.html',
                           access_token=auth_tok['access_token'],
                           refresh_token=auth_tok['refresh_token'],
                           config=config)


@app.route("/authenticate")
def authenticateWithOAuth():
    
    auth_tok = None
    code = request.args.get('code')
    
    print code 

    # prepare the payload
    payload = {
        'scopes': 'email sweet',
        'client_secret': 'config.app_secret',
        'code': code,
        'redirect_uri': config.redirect_uri,
        'grant_type': 'authorization_code',
        'client_id': config.app_id
    }

    # token exchange endpoint
    oauth_token_x_endpoint = config.swtstoreURL + '/oauth/token'
    resp = requests.post(oauth_token_x_endpoint, data=payload)
    auth_tok = json.loads(resp.text)
    print 'recvd auth token from swtstore'
    print auth_tok

    if 'error' in auth_tok:
        print auth_tok['error']
        return make_response(auth_tok['error'], 200)

    # set sessions etc
    session['auth_tok'] = auth_tok
    session['auth_tok']['issued'] = datetime.utcnow()
    
    return redirect(url_for('index'))

if __name__ == "__main__":
    
    app.debug = True
    app.run()
