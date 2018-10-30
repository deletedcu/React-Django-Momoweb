from django.conf.urls import url, include
from . import views
from push_notifications.api.rest_framework import GCMDeviceAuthorizedViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'device/gcm', GCMDeviceAuthorizedViewSet)
router.register(r'alert', views.UserExtremeAlertViewSet, base_name='alert')
router.register(r'quote', views.UserQuoteViewSet, base_name='quote')


urlpatterns = [
    url(r'^$', views.index, name='main'),
    url(r'^', include(router.urls)),
    url(r'^dashboard$', views.index),
    url(r'^quote_fake/?$', views.FakeQuoteData.as_view()),
    url(r'^top/?$', views.TopStockView.as_view(), name='top'),
    url(r'^stock/(?P<place>[a-zA-Z\.0-9_]+)/(?P<symbol>\w+)/$', views.StockRedirectView.as_view(), name='stock_redirect'),
    url(r"^plans/confirm/(?P<plan>.+)$",
        views.ConfirmSubscriptionFormView.as_view(),
        name="confirm",
    ),
    url(r'^firebase-messaging-sw.js', view=views.fcm_sw),
]
