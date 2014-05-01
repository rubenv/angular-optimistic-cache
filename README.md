# angular-optimistic-cache

> Optimistically use cached data before a request finishes.

[![Build Status](https://travis-ci.org/rubenv/angular-optimistic-cache.png?branch=master)](https://travis-ci.org/rubenv/angular-optimistic-cache)

## The problem
Usually you have something like this in your Angular.JS application:

```js
angular.module('myApp').controller('PeopleCtrl', function ($scope, $http) {
    $http.get('/api/people').then(function (result) {
        $scope.people = result.data;
    });
});
```

```html
<ul>
    <li ng-repeat="person in people">{{person.name}}</li>
</ul>
```

This simple example is a page that will fetch a list of people from the backend and shows it on a page.

Unfortunately, it suffers from the "uncomfortable silence". Here's a diagram to explain:

![Uncomfortable silence in lists](diagrams/page-load.png)

When you arrive on the page, it'll first show a blank page. After some time, this gets swapped with the data. Your app feels fast because navigation between screens is instant, but it feels jarring.

This is especially annoying when switching back-and-forth between pages, as it happens every time.

A similar thing happens when going from the list to a detail page:

![Uncomfortable silence in lists](diagrams/master-detail.png)

Isn't it a bit strange that you know the name of the person on which the user clicked, but upon navigation that suddenly gets lost, forcing us to wait until all the info is loaded? Why not start out with showing the name while the rest of the data loads?

The `angular-optimistic-cache` module is a very lightweight module to add some of that to your application. It's probably the least intrustive way to avoid uncomfortable silences.

## Installation
Add angular-optimistic-cache to your project:

```
bower install --save angular-optimistic-cache
```

Add it to your HTML file:

```html
<script src="bower_components/angular-optimistic-cache/dist/angular-optimistic-cache.min.js"></script>
```

Reference it as a dependency for your app module:

```js
angular.module('myApp', ['rt.optimisticcache']);
```

## How it works

This module works by wrapping the promises that you wait for. It adds a `toScope` method where you can indicate where the result should be placed on the scope.

It then does the following:

* The promise is loaded as usual, in the background.
* If it has a previously-cached value for the promise, it'll put that one on the scope.
* Once the promise is loaded, it replaces the scope value with the up-to-date data.

The end result: users see data instantly, which is updated once it's loaded.

## Usage

Let's take another look at the controller in the example above:

```js
angular.module('myApp').controller('PeopleCtrl', function ($scope, $http) {
    $http.get('/api/people').then(function (result) {
        $scope.people = result.data;
    });
});
```

First split out the loading function:

```js
angular.module('myApp').controller('PeopleCtrl', function ($scope, $http) {
    function fetchPeople() {
        return $http.get('/api/people').then(function (result) {
            return result.data;
        });
    }
    
    fetchPeople().then(function (people) {
        $scope.people = people;
    });
});
```

Then wrap the promise:

```js
angular.module('myApp').controller('PeopleCtrl', function ($scope, $http, optimisticCache) {
    function fetchPeople() {
        var promise = $http.get('/api/people').then(function (result) {
            return result.data;
        });
        return optimisticCache(promise, '/api/people');
    }
    
    fetchPeople().then(function (people) {
        $scope.people = people;
    });
});
```

Now change the usage:

```js
angular.module('myApp').controller('PeopleCtrl', function ($scope, $http, optimisticCache) {
    function fetchPeople() {
        var promise = $http.get('/api/people').then(function (result) {
            return result.data;
        });
        return optimisticCache(promise, '/api/people');
    }
    
    fetchPeople().toScope($scope, 'people');
});
```

And magic will happen!

TODO: Finish docs

## License 

    (The MIT License)

    Copyright (C) 2014 by Ruben Vermeersch <ruben@rocketeer.be>

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
