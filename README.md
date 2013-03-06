# grunt-gui

A collection of grunt tasks specifically related to Guardian Interactive projects. If any one of these gets large (and generally useful) enough to be broken out into its own repo then so be it, but for now the limited scope and co-dependencies of these tasks means it probably makes sense for them to live together here.

## Tasks

### fetch
Fetch a file from a remote URL, optionally process it, and save it locally

```js
grunt.initConfig({
  fetch: {
    options: {
      process: require( 'csv-to-json' )
    },
    table1: {
      url: https://docs.google.com/a/guardian.co.uk/spreadsheet/ccc?key=123456#gid=0,
      dest: 'project/data/table1.json'
    },
    table2: {
      url: https://docs.google.com/a/guardian.co.uk/spreadsheet/ccc?key=234567#gid=0,
      dest: 'project/data/table2.json'
    }
  }
});
```

### createS3Instance
Creates an s3 instance using the [AWS Node SDK](http://aws.amazon.com/sdkfornodejs/), which is then used by subsequent tasks in the deployment sequence.

Because there isn't currently a good way to share stuff between tasks in grunt, it uses a bad way instead: monkey patching. After this task has run, a reference to the instance is available for other tasks in the same sequence as `grunt.s3`.

For best results add your credentials as environment variables. On OS X, add the following lines to your `~/.bash_profile` file:

```shell
export AWS_ACCESS_KEY_ID='yourKeyIdHere'
export AWS_SECRET_ACCESS_KEY='yourSecretKeyHere'
```

Alternatively you can pass them as config options:

```js
// DO NOT DO THIS - you may accidentally commit your credentials to GitHub
grunt.initConfig({
  s3: {
    accessKeyId: 'yourKeyIdHere',
    secretAccessKey: 'yourSecretKeyHere'
  }
});

// DO THIS INSTEAD
grunt.initConfig({
  s3: {
    credentials: '~/.aws_credentials.json' // or wherever. Should contain same properties as above
  }
});
```


### downloadFromS3
This multi-task downloads `key` from `bucket` and writes it to `dest`. As in:

```js
grunt.initConfig({
  downloadFromS3: {
    options: {
      bucket: '<%= s3.bucket %>'
    },
    manifest: {
      options: {
        key: '<%= projectPath %>/manifest.json',
        dest: 'tmp/manifest.json'
      }
    }
  }
});
```

### verifyManifest
Check that the project's `guid` (set in `Gruntfile.js`) is the same as that in the existing project `manifest.json` file on S3. This is to prevent naming collisions.

### replaceTags
Goes through files and replaces <%= tags %> with the appropriate variables:

```js
grunt.initConfig({
  replaceTags: {
    preDeploy: {
      files: [
        {
          expand: true,
          cwd: 'project/boot/',
          src: [ '**/*' ],
          dest: 'tmp/deploy/boot'
        }
      ],
      options: {
        variables: {
          projectUrl: 'http://interactive.guim.co.uk/my-project',
          versionUrl: 'http://interactive.guim.co.uk/my-project/v/3'
        }
      }
    }
  }
});
```

### lockProject
Uploads a file to `<%= projectPath %>/locked.txt`, to prevent concurrency fuckups. `lockProject:unlock` deletes the file once deployment has successfully completed.


### uploadToS3
Multi-task to upload files and data. If you pass in `key` it will upload a single file, if you pass in `root` it will upload the contents of a folder to `pathPrefix`. With `key` you have the option of `src`, which uploads the contents of a file (guessing the mime-type) or `data`, which does exactly what you'd expect.

```js
grunt.initConfig({
  uploadToS3: {
    options: {
      bucket: '<%= s3.bucket %>'
    },
    manifest: {
      options: {
        key: '<%= projectPath %>/manifest.json',
        data: '{"guid":"<%= guid %>","version":<%= version %>}',
        params: {
          CacheControl: 'no-cache',
          ContentType: 'application/json'
        }
      }
    },
    version: {
      options: {
        root: 'test/fixtures/sample/version/',
        pathPrefix: '<%= versionPath %>',
        params: {
          CacheControl: 'max-age=31536000'
        }
      }
    },
    boot: {
      options: {
        root: 'tmp/boot/',
        pathPrefix: '<%= projectPath %>',
        params: {
          CacheControl: 'max-age=20'
        }
      }
    }
  }
});
```
