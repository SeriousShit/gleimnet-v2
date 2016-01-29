System.register(['angular2/core', "angular2/router", "angular2/http"], function(exports_1) {
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var core_1, router_1, http_1, http_2;
    var Home, User;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (router_1_1) {
                router_1 = router_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
                http_2 = http_1_1;
            }],
        execute: function() {
            Home = (function () {
                function Home(router, http) {
                    this.router = router;
                    this.http = http;
                    this.timelinepath = 'api/timeline';
                    this.user = new User();
                    this.router = router;
                    this.http = http;
                    this.username = localStorage.getItem('username');
                }
                Home.prototype.ngOnInit = function () {
                    var basicAuth = localStorage.getItem('AuthKey');
                    if (basicAuth) {
                        this.loadProfilInfos();
                        this.loadTimeline();
                    }
                };
                Home.prototype.loadProfilInfos = function () {
                    var _this = this;
                    var headers = this.headers();
                    this.http.get('api/users/username/' + this.username, { headers: headers })
                        .map(function (res) { return res.json(); })
                        .subscribe(function (res) {
                        _this.user = res;
                        _this.friends = _this.user.friends;
                        console.log(_this.user.friends);
                    });
                };
                Home.prototype.loadTimeline = function () {
                    var _this = this;
                    var headers = this.headers();
                    this.http.get(this.timelinepath, { headers: headers })
                        .map(function (res) { return res.json(); })
                        .subscribe(function (res) {
                        _this.messages = res.messages;
                        //console.log(this.messages);
                    });
                };
                Home.prototype.postNewPosting = function (content) {
                    var _this = this;
                    var body = JSON.stringify({ content: content });
                    this.http.post(this.timelinepath, body, { headers: this.headers() })
                        .map(function (response) {
                    })
                        .subscribe(function (response) {
                        _this.loadTimeline();
                    }, function (error) {
                        //this.message = error.json().message;
                        //this.error = error
                    });
                };
                Home.prototype.commentOnPosting = function (content, postId) {
                    var _this = this;
                    var body = JSON.stringify({ content: content });
                    this.http.post('api/timeline/message/' + postId, body, { headers: this.headers() })
                        .map(function (response) {
                    })
                        .subscribe(function (response) {
                        _this.loadTimeline();
                    }, function (error) {
                        //this.message = error.json().message;
                        //this.error = error
                    });
                };
                Home.prototype.headers = function () {
                    var headers = new http_2.Headers();
                    headers.append('Content-Type', 'application/json');
                    var basicAuth = localStorage.getItem('AuthKey');
                    headers.append('Authorization', basicAuth);
                    return headers;
                };
                Home = __decorate([
                    core_1.Component({
                        selector: 'Home',
                        templateUrl: './app/home/home.html'
                    }), 
                    __metadata('design:paramtypes', [router_1.Router, http_1.Http])
                ], Home);
                return Home;
            })();
            exports_1("Home", Home);
            User = (function () {
                function User() {
                }
                return User;
            })();
        }
    }
});
//# sourceMappingURL=home.js.map