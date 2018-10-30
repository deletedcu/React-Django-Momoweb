from django.shortcuts import render
from djstripe.decorators import subscription_payment_required
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse_lazy, reverse
from django.views.generic import TemplateView, RedirectView
from djstripe.views import ConfirmFormView
from django.http import HttpResponse
from django.conf import settings
import os
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import list_route
from rest_framework.permissions import IsAuthenticated, AllowAny
from . import mixin
from . import models
from . import serializer
import json
import logging
from collections import defaultdict
from djstripe import utils
from datetime import datetime
import requests


log = logging.getLogger('django')

class ConfirmSubscriptionFormView(ConfirmFormView):
    success_url = reverse_lazy("dashboard:main")


@login_required
@subscription_payment_required
def index(request):
    ctx = {
        'highs': [
            ('ALX', 5, 0.29),
            ('ALX', 4, 0.29),
            ('ALX', 3, 0.29),
            ('ALX', 2, 0.29),
            ('ALX', 1, 0.29),
        ],
        'lows': [
            ('AAPL', 5, 0.29),
            ('AAPL', 4, 0.29),
            ('AAPL', 3, 0.29),
            ('AAPL', 2, 0.29),
            ('AAPL', 1, 0.29),
        ]
    }
    return render(request, 'app.html', ctx)

def fcm_sw(request):
    #  for development
    filename = os.path.join(settings.BASE_DIR, 'static', 'js', 'firebase-messaging-sw.js')
    return HttpResponse(open(filename).read(), content_type='application/javascript')


class UserExtremeAlertViewSet(viewsets.ModelViewSet):
    serializer_class = serializer.UserExtremeAlertSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        return models.UserExtremeAlert.objects.filter(user=user).order_by('-id')

    @list_route(methods=['post', 'get'], permission_classes=[AllowAny,])
    def send(self, request):
        log.info('*' * 50)
        data = json.loads(request.body.decode('utf-8'))
        tickers = defaultdict(list)
        log.info('data: %s' % data)
        for item in data:
            if not item.get('ticker') or not item.get('price'):
                continue
            tickers[item.get('ticker').upper()].append(item)

        log.info('tickers: %s' % tickers)
        alerts = models.UserExtremeAlert.objects.filter(category__in=tickers.keys())
        states = (models.UserExtremeAlert.STATE_NEW_HIGH, models.UserExtremeAlert.STATE_NEW_LOW)
        for row in alerts:
            log.info('handle: %s' % row)
            # if not utils.subscriber_has_active_subscription(row.user):
            #     log.info('   * user hasn\'t active subscription, skipped')

            for item in tickers.get(row.category, []):
                try:
                    check_state = row.check_state(item)
                    log.info('  -> check %s, state: %s' % (item, check_state))
                    if check_state in states:
                        m = 'high' if check_state == models.UserExtremeAlert.STATE_NEW_HIGH else 'low'
                        msg = '%s has just reached a new %s %.2f [%s]' % \
                              (row.category, m, item.get('price'), datetime.now().strftime('%b %d - %I:%M %p %Z'))
                        click_action = '%s%s?push=1' % (settings.PROJECT_URL, reverse('dashboard:main'))
                        click_icon = '%s%s%s?push=1' % (settings.PROJECT_URL,
                                                      settings.STATIC_URL,
                                                      'imgs/momo.png')
                        log.info('  * send msg to user: %s, %s, %s' % (msg, click_action, click_icon))
                        res = row.send_notify(log, msg, extra={
                            'title': 'MOMO-WEB ALERT',
                            'click_action': click_action,
                            'icon': click_icon
                        })
                        log.info('   send result: %s' % res)
                except Exception as e:
                    log.exception(e)

        return Response({'status': 'OK'})

class UserQuoteViewSet(viewsets.ModelViewSet):
    serializer_class = serializer.UserQuoteSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        return models.UserQuote.objects.filter(user=user).order_by('-id')


class FakeQuoteData(TemplateView):
    def load(self, symbol):
        api_url = settings.QUOTE_DATA_API_URL % symbol
        try:
            resp = requests.get(api_url, timeout=6)
            if resp.status_code != 200:
                log.error('Cant load data from url: %s, resp code: %s, resp: %s' %
                          (api_url, resp.status_code, resp.content))
            return resp.content
        except Exception as e:
            log.exception('Cant load data from url: %s' % api_url)

    def get(self, request, *args, **kwargs):
        symbol = request.GET.get('symbol')
        return HttpResponse(self.load(symbol))
        # import random
        # data = '{symbol},1,5,1,7,{last},10,1,7,{high},11,1,7,{low},27,1,4,{vol}'.format(
        #     symbol=symbol,
        #     last=random.randint(10, 100),
        #     high=random.randint(80, 100),
        #     low=random.randint(10, 20),
        #     vol=random.randint(40, 60)
        # )
        # return HttpResponse(data)

    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

class TopStockView(mixin.JSONResponseMixin, TemplateView):
    def get(self, request, *args, **kwargs):
        log.info({'data': models.StockStat.top()})
        return self.render_to_response({'data': models.StockStat.top()})

    def render_to_response(self, context, **response_kwargs):
        return self.render_to_json_response(context, **response_kwargs)

class StockRedirectView(RedirectView):
    STOCK_CHOICES = dict([
        ('cnbc.com', 'http://data.cnbc.com/quotes/'),
        ('stocktwits.com', 'https://stocktwits.com/symbol/'),
        ('marketwatch.com', 'http://www.marketwatch.com/investing/stock/'),
        ('seekingalpha.com', 'https://seekingalpha.com/symbol/'),
    ])

    def get_redirect_url(self, place, symbol, *args, **kwargs):
        place = place.lower()
        symbol = symbol.upper()
        if place in self.STOCK_CHOICES:
            return self.STOCK_CHOICES[place] + symbol
        return reverse_lazy('dashboard:main')

    def get(self, request, place, symbol, *args, **kwargs):
        models.StockStat.incr(symbol.upper())
        return super().get(request, place, symbol, *args, **kwargs)
