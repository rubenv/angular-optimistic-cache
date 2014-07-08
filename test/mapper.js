describe('Optimistic Cache: Mapper', function () {
    var $q = null;
    var $rootScope = null;
    var optimisticCache = null;

    function Person(id) {
        this.ssn = id;
    }

    var mapperOptions = {
        mapper: function (obj) {
            var person = new Person(obj.id);
            if (obj.name) {
                person.name = obj.name;
            }
            return person;
        }
    };

    beforeEach(module('rt.optimisticcache'));

    beforeEach(inject(function ($injector) {
        $q = $injector.get('$q');
        $rootScope = $injector.get('$rootScope');
        optimisticCache = $injector.get('optimisticCache');
    }));

    it('Can supply a mapper (single object)', function () {
        var deferred = $q.defer();
        var scope = {};

        optimisticCache(deferred.promise, 'test', {
            mapper: function (obj) {
                return new Person(obj.id);
            }
        }).toScope(scope, 'test');
        deferred.resolve({
            id: 123
        });
        $rootScope.$digest();
        assert.equal(scope.test.ssn, 123);
        assert.equal(scope.test.constructor, Person);
    });

    it('Scope gets pre-filled if we already have a cached copy', function () {
        // Fill cache
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test', mapperOptions);
        deferred.resolve({
            id: 123
        });
        $rootScope.$digest();

        // Request it again somewhere else
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test', mapperOptions);

        // Should be on scope now
        var scope = {};
        promise.toScope(scope, 'test');
        assert.equal(scope.test.ssn, 123);
        assert.equal(scope.test.constructor, Person);

        // Scope gets updated when results come in
        deferred.resolve({
            id: 124
        });
        $rootScope.$digest();
        assert.equal(scope.test.ssn, 124);
        assert.equal(scope.test.constructor, Person);
    });

    it('Updates scope objects in place', function () {
        var result = null;
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test', mapperOptions);
        promise.toScope({}, 'test').then(function (obj) {
            result = obj;
        });
        deferred.resolve({
            id: 1,
            name: 'Ruben'
        });

        var scope = {};
        var result2 = null;
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test', mapperOptions);
        promise.toScope(scope, 'person').then(function (obj) {
            result2 = obj;
            assert.equal(result2, result);
        });
        assert.equal(scope.person, result);

        deferred.resolve({ id: 1, name: 'Ruben' });
        $rootScope.$digest();
        assert.equal(scope.person.ssn, 1);
        assert.equal(scope.person.name, 'Ruben');
        assert.equal(scope.person.constructor, Person);

        assert.equal(result2, result);
        assert.equal(scope.person, result);
    });

    it('Updates scope arrays in place', function () {
        var result = null;
        var deferred = $q.defer();
        var promise = optimisticCache(deferred.promise, 'test', mapperOptions);
        promise.toScope({}, 'test').then(function (obj) {
            result = obj;
        });
        deferred.resolve([
            { id: 1, name: 'Ruben' },
            { id: 2, name: 'Test' }
        ]);

        var scope = {};
        var result2 = null;
        deferred = $q.defer();
        promise = optimisticCache(deferred.promise, 'test', mapperOptions);
        promise.toScope(scope, 'people').then(function (obj) {
            result2 = obj;
            assert.equal(result2, result);
        });
        assert.equal(scope.people, result);

        deferred.resolve([
            { id: 1, name: 'Test 2' },
            { id: 2, name: 'Test 3' }
        ]);
        $rootScope.$digest();
        console.log(scope.people);
        assert.equal(scope.people[0].ssn, 1);
        assert.equal(scope.people[0].name, 'Test 2');
        assert.equal(scope.people[0].constructor, Person);

        assert.equal(result2, result);
        assert.equal(scope.people, result);
    });

    // TODO: Adjust to test Mapper functionality
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
            result = obj;
        });
        assert.equal(scope.person.name, 'Ruben');

        deferred.resolve({ id: 1, name: 'New' });
        $rootScope.$digest();

        assert.equal(result.name, 'New');
        assert.equal(scope.person, result);
    });

    // TODO: Adjust to test Mapper functionality
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
});

