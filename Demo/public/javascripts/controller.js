angular.module('cs411', ['ngRoute', 'ngCookies'])

    .controller('cs411ctrl', function ($scope, $http, $cookies) {

        $scope.initApp = function () {
            $scope.authorized = false
            const authCookie = $cookies.get('authStatus')
            const spotifyId = $cookies.get('authInfo')



            if (authCookie) {
                $scope.authorized = authCookie
                $http.get('http://localhost:5000/api/' + spotifyId)
                    .then(function (res){
                        console.log(res)
                        $scope.username =res.data.username
                        $scope.top3 = res.data.artists
                    })
                //$scope.username = spotifyId
            } else {

            }
        }

        $scope.search = function () {
            window.location.replace('/search/' + $scope.name)
        }

        $scope.doSpotifyAuth = function () {
            var openUrl = '/auth/spotify/'
            $scope.authorized = true
            window.location.replace(openUrl)
        }

        $scope.logout = function () {

            $http.get('/auth/logout')
                .then(function (response) {
                    $scope.authorized = false
                    $cookies.remove('authStatus')
                    $cookies.remove('authInfo')
                })
        }
    })
