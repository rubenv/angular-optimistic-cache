describe('Optimistic Cache', function () {
    var $q = null;
    var $rootScope = null;
    var optimisticCache = null;

    beforeEach(module('rt.optimisticcache'));

    beforeEach(inject(function ($injector) {
        $q = $injector.get('$q');
        $rootScope = $injector.get('$rootScope');
        optimisticCache = $injector.get('optimisticCache');
    }));

    it('Adds a toScope method', function () {
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test');
        assert.isFunction(promise.toScope);
    });

    it('Scope gets pre-filled if we already have a cached copy', function () {
        // Fill cache
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test');
        deferred.resolve({
            id: 123
        });
        $rootScope.$digest();

        // Request it again somewhere else
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test');

        // Should be on scope now
        var scope = {};
        promise.toScope(scope, 'test');
        assert.equal(scope.test.id, 123);

        // Scope gets updated when results come in
        deferred.resolve({
            id: 124
        });
        $rootScope.$digest();
        assert.equal(scope.test.id, 124);
    });

    it('Updates scope objects in place', function () {
        var result = null;
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test');
        promise.then(function (obj) {
            result = obj;
        });
        deferred.resolve({
            id: 1,
            name: 'Ruben'
        });

        var scope = {};
        var result2 = null;
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test');
        promise.toScope(scope, 'person').then(function (obj) {
            result2 = obj;
            assert.equal(result2, result);
        });
        assert.equal(scope.person, result);

        deferred.resolve({ id: 1, name: 'Ruben' });

        assert.equal(result2, result);
        assert.equal(scope.person, result);
    });

    it('Updates scope arrays in place', function () {
        var result = null;
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test');
        promise.then(function (obj) {
            result = obj;
        });
        deferred.resolve([
            { id: 1, name: 'Ruben' },
            { id: 2, name: 'Test' }
        ]);

        var scope = {};
        var result2 = null;
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test');
        promise.toScope(scope, 'people').then(function (obj) {
            result2 = obj;
            assert.equal(result2, result);
        });
        assert.equal(scope.people, result);

        deferred.resolve([
            { id: 1, name: 'Test 2' },
            { id: 2, name: 'Test 3' }
        ]);

        assert.equal(result2, result);
        assert.equal(scope.people, result);
    });

    it('Uses results from getAll to pre-populate get', function () {
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test');
        deferred.resolve([
            { id: 1, name: 'Ruben' },
            { id: 2, name: 'Test' }
        ]);
        $rootScope.$digest();

        var scope = {};
        var result = null;
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test/1');
        promise.toScope(scope, 'person').then(function (obj) {
            return result = obj;
        });
        assert.equal(scope.person.name, 'Ruben');

        deferred.resolve({ id: 1, name: 'New' });
        $rootScope.$digest();

        assert.equal(result.name, 'New');
        assert.equal(scope.person, result);
    });

    it('Can disable pre-populate', function () {
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test', {
            populateChildren: false
        });
        deferred.resolve([
            { id: 1, name: 'Ruben' },
            { id: 2, name: 'Test' }
        ]);
        $rootScope.$digest();

        var scope = {};
        var result = null;
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test/1');
        promise.toScope(scope, 'person').then(function (obj) {
            result = obj;
        });

        // Expect a cache miss
        assert.equal(scope.person, undefined);
        deferred.resolve({ id: 1, name: 'New' });
        $rootScope.$digest();

        assert.equal(result.name, 'New');
        assert.equal(scope.person, result);
    });

    it('Can use different ID field');
    it('Can expire caches');
});
