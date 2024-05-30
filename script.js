AWS.config.region = 'eu-north-1'; // Regiunea ta

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'eu-north-1:a6908557-0992-4a4a-a1d9-3f40bdfc14e9',
});

const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    params: { Bucket: 'poze12a' },
});

// Definim o variabilă pentru a urmări dacă camera este deschisă sau nu
let cameraDeschisa = false;
const info = document.getElementById('info');
info.textContent = 'Fă o poză care să rămână amintire a acestei ultime zile din viața de elev';
info.style.fontSize = '24px';
info.style.marginTop = '20px';
info.style.fontFamily = 'Times New Roman';
info.style.fontWeight = 'bold';
info.style.display = 'block';

document.getElementById('captureButton').addEventListener('click', function() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const captureButton = document.getElementById('captureButton');
    const sendButton = document.getElementById('sendButton');
    const previewImage = document.getElementById('previewImage');
    const repetatiButton = document.getElementById('repetatiButton'); // Butonul pentru repetarea pozei

    if (!cameraDeschisa) { // Verificăm dacă camera nu este deja deschisă
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
                video.srcObject = stream;
                video.play();
                video.style.display = 'block';
                video.setAttribute('playsinline', 'true'); // Previne deschiderea full screen pe iOS
                video.setAttribute('controls', 'true'); // Previne deschiderea full screen pe unele browsere

                // Setăm variabila cameraDeschisa la true pentru a indica că camera este deschisă
                cameraDeschisa = true;

                captureButton.addEventListener('click', function capturePhoto() {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const context = canvas.getContext('2d');
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);

                    stream.getTracks().forEach(track => track.stop());
                    video.style.display = 'none';
                    captureButton.style.display = 'none';
                    info.style.display = 'none';
                    previewImage.src = canvas.toDataURL('image/png');
                    previewImage.style.display = 'block';
                    sendButton.style.display = 'block';
                    repetatiButton.style.display = 'block'; // Afișăm butonul pentru repetarea pozei

                }, { once: true });

            }).catch(function(error) {
                console.error('Eroare la accesarea camerei: ', error);
            });
        } else {
            alert('Browser-ul tău nu suportă accesul la cameră.');
        }
    } else {
        // Dacă camera este deja deschisă, nu facem nimic când utilizatorul apasă butonul de capturare
        console.log('Camera este deja deschisă!');
    }
});

// Adăugăm evenimentul click pentru butonul de repetare a capturii pozei
document.getElementById('repetatiButton').addEventListener('click', function() {
    // Resetați variabila cameraDeschisa pentru a permite redeschiderea camerei
    cameraDeschisa = false;

    // Afișăm din nou butonul de capturare
    document.getElementById('captureButton').style.display = 'block';

    // Ascundem imaginea de previzualizare și butoanele
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('sendButton').style.display = 'none';
    document.getElementById('repetatiButton').style.display = 'none';
});

document.getElementById('sendButton').addEventListener('click', function() {
    const canvas = document.getElementById('canvas');
    const previewImage = document.getElementById('previewImage');
    const sendButton = document.getElementById('sendButton');

    const imageDataURL = canvas.toDataURL('image/png');
    uploadImage(imageDataURL, function() {
        repetatiButton.style.display = 'none';
        sendButton.style.display = 'none';
        previewImage.style.display = 'none';
        info.textContent = 'Felicitări! Această poză va fi adăugată într-un album ce va fi disponibil de mâine pe acest cod QR.';
        info.style.fontSize = '24px';
        info.style.marginTop = '20px';
        info.style.fontFamily = 'Times New Roman';
        info.style.fontWeight = 'bold';
        info.style.display = 'block';
    });
});

function uploadImage(imageDataURL, callback) {
    const blobData = dataURLtoBlob(imageDataURL);
    console.log('Se încarcă imaginea în S3...');

    const params = {
        Key: `images/captured_image_${Date.now()}.png`,
        Body: blobData,
        ContentType: 'image/png'
    };

    console.log('Parametri încărcare:', params);

    s3.upload(params, function(err, data) {
        if (err) {
            console.error('Eroare la încărcarea imaginii: ', err);
        } else {
            console.log('Imagine încărcată cu succes: ', data.Location);
            if (callback) {
                callback();
            }
        }
    });
}

function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
}
