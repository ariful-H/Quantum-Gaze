// Firebase configuration
const firebaseConfig = {
    apiKey: "2eaf2be0d1msh48f50fe2afeaa3cp167efajsn2d2c5e509894",
    authDomain: "quantumgaze.firebaseapp.com",
    projectId: "quantumgaze",
    storageBucket: "quantumgaze.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123def456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth state observer
auth.onAuthStateChanged((user) => {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const profileImage = document.getElementById('profileImage');

    if (user) {
        // User is signed in
        authButtons.classList.add('d-none');
        userProfile.classList.remove('d-none');
        
        // Update profile image
        if (user.photoURL) {
            profileImage.src = user.photoURL;
        } else {
            profileImage.src = '/static/img/default-avatar.png';
        }

        // Load user's favorites
        loadUserFavorites(user.uid);
    } else {
        // User is signed out
        authButtons.classList.remove('d-none');
        userProfile.classList.add('d-none');
        profileImage.src = '';
    }
});

// Show login modal
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

// Show signup modal
function showSignupModal() {
    const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
    signupModal.show();
}

// Email/Password Sign In
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        showToast('Successfully signed in!');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Email/Password Sign Up
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const confirmPassword = e.target.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: username
        });
        bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
        showToast('Account created successfully!');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Google Sign In
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        bootstrap.Modal.getInstance(document.getElementById('loginModal'))?.hide();
        showToast('Successfully signed in with Google!');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Apple Sign In
async function signInWithApple() {
    const provider = new firebase.auth.OAuthProvider('apple.com');
    try {
        await auth.signInWithPopup(provider);
        bootstrap.Modal.getInstance(document.getElementById('loginModal'))?.hide();
        showToast('Successfully signed in with Apple!');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Phone Sign In
function signInWithPhone() {
    // Implement phone authentication logic here
    showToast('Phone authentication coming soon!', 'info');
}

// Sign Out
async function logout() {
    try {
        await auth.signOut();
        showToast('Successfully signed out!');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Load user's favorites
async function loadUserFavorites(userId) {
    try {
        const response = await fetch(`/api/favorites/${userId}`);
        const favorites = await response.json();
        
        const favoritesSection = document.getElementById('favoritesSection');
        if (favorites.length === 0) {
            favoritesSection.innerHTML = '<p class="text-muted">No favorites yet. Add some videos to your favorites!</p>';
            return;
        }

        favoritesSection.innerHTML = favorites.map(favorite => `
            <div class="favorite-item">
                <img src="${favorite.thumbnail}" alt="${favorite.title}">
                <h5>${favorite.title}</h5>
                <button onclick="removeFavorite('${favorite.id}')" class="btn btn-sm btn-danger">
                    Remove
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Toast notification helper
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
} 