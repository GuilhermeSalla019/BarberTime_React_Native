const AWS = require('aws-sdk');

module.exports = {
    IAM_USER_KEY: 'AKIARWWKTUFMP5CDP3VK',
    IAM_USER_SECRET: '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',
    BUCKET_NAME: 'barbertime',
    AWS_REGION: 'us-east-1',

    //Upload de arquivo
    uploadToS3: function (file, filename, acl = 'public-read') {
        return new Promise((resolve, reject) => {
            let IAM_USER_KEY = this.IAM_USER_KEY;
            let IAM_USER_SECRET = this.IAM_USER_SECRET;
            let BUCKET_NAME = this.BUCKET_NAME;

            //Pré conexão com bd
            
            let s3bucket = new AWS.S3({
                accessKeyId: IAM_USER_KEY,
                aecretAccessKey: IAM_USER_SECRET,
                Bucket: BUCKET_NAME,
            });

            //Conexão com bd AWS e parametros do arquivo
    
            s3bucket.createBucket(function(){
                var params = {
                    Bucket: BUCKET_NAME,
                    Key: filename,
                    Body: file.data,
                    ACL: acl, //controle de acesso "Publico" ou "Privado"
                };

            //Upload realizado e Call-Back de retorno para saber se deu erro ou sucesso.
            s3bucket.upload(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return resolve({ error: true, message: err });
                }
                console.log(data);
                return resolve({ error: false, message: data });
            });
        });
    });
},

    //Função deletar arquivos salvos
    deleteFileS3: function (key) {
        return new Promise(( resolve, reject ) => {
            let IAM_USER_KEY = this.IAM_USER_KEY;
            let IAM_USER_SECRET = this.IAM_USER_SECRET;
            let BUCKET_NAME = this.BUCKET_NAME;

            let s3bucket = new AWS.S3({
                accessKeyId: IAM_USER_KEY,
                secretAccessKey: IAM_USER_SECRET,
                Bucket: BUCKET_NAME,
            });

            //Busca no banco pela key e deletar, Call-back de retorno.
            s3bucket.createBucket(function() {
                s3bucket.deleteObject(
                {
                    Bucket: BUCKET_NAME,
                    Key: key,
                },
                function (err,  data) {
                    if(err) {
                        console.log(err);
                        return resolve({ error: true, message: err});
                    }
                    console.log(data);
                    return resolve({ error: false, message: data });
                    }
                );
            });
        });
    },
};