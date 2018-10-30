from .settings import *

DEBUG = True

# STATIC_ROOT = os.path.join(BASE_DIR, "static")
STATIC_ROOT = None
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

PROJECT_URL = 'http://localhost'

STRIPE_PUBLIC_KEY = os.environ.get("STRIPE_PUBLIC_KEY", "pk_test_7KalVdBJXcZ633woqvuea7N9")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "sk_test_CGjb6DYnKAVP1looE2ktO3du")
