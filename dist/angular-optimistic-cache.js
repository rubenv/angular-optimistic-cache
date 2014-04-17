angular.module('rt.optimisticcache', []).factory('optimisticCache', function () {
  /*
     * Magical call caching.
     *
     * The code below provides a call cache. Basically we'll cache any call and
     * optimistically set the result on the scope, if possible. The call is
     * still executed as usual and the result will be merged on the scope. The
     * promise is only resolved after the call completes.
     *
     * The effect of this is that CRUD get / getAll calls appear to happen
     * instantly: The scope immediately gets the data. But we still maintain
     * data consistency: calls happen in the background and new data is merged
     * in when available.
     */
  var cache = {};
  // Get a cached result.
  function fetchFromCache(url) {
    return cache[url];
  }
  // Store in cache
  function cacheResult(url, result, options) {
    merge(cache, url, result);
    if (angular.isArray(result) && options.populateChildren) {
      // Cache dependents of getAll call (partial results)
      for (var i = 0; i < result.length; i++) {
        var obj = result[i];
        cacheResult(cacheResult(url + '/' + obj[options.idField], obj));
      }
    }
  }
  // Merge results, rather than override, to make sure references stay intact.
  //
  // Results from getAll are used to pre-populate the individual object cache.
  // We use copies here to make sure that they're different objects: we don't
  // want to overwrite objects in the getAll cache when a get result comes in.
  function merge(parent, field, obj) {
    if (!obj) {
      return;
    }
    if (!parent[field]) {
      parent[field] = obj;
    } else {
      var target = parent[field];
      if (angular.isArray(target)) {
        for (var i = 0; i < obj.length; i++) {
          merge(target, i, angular.copy(obj[i]));
        }
        target.length = obj.length;
      } else {
        for (var key in obj) {
          target[key] = obj[key];
        }
      }
    }
  }
  // Augments the promise with a toScope method, which assigns the result of
  // the call to the scope.
  return function optimisticCache(promise, url, options) {
    if (!options) {
      options = {};
    }
    if (options.idField == null) {
      options.idField = 'id';
    }
    if (options.populateChildren == null) {
      options.populateChildren = true;
    }
    // Cache all calls (regardless of whether toScope is used).
    promise.then(function (obj) {
      cacheResult(url, obj, options);
    });
    // Decorate the promise with a toScope method.
    promise.toScope = function toScope(scope, field) {
      // Fill from cache initially
      var cachedResult = fetchFromCache(url);
      merge(scope, field, cachedResult);
      promise.then(function (obj) {
        // Merge result to scope
        merge(scope, field, obj);
      });
      // Return promise for chaining
      return promise.then(function () {
        return scope[field];
      });
    };
    return promise;
  };
});