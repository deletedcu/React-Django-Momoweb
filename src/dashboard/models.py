from django.db import models, IntegrityError
from django.conf import settings
from push_notifications.models import GCMDevice
from django.dispatch import receiver
from collections import defaultdict
from datetime import date, timedelta



# class UserProfile(models.Model):
#     user = models.ForeignKey(settings.AUTH_USER_MODEL)
#     push_enabled = models.BooleanField(default=True, blank=True)
#
#     class Meta:
#         db_table = 'user_profile'

class UserExtremeAlert(models.Model):
    STATE_NEW_HIGH = 'NEW_HIGH'
    STATE_NEW_LOW = 'NEW_LOW'
    STATE_INITED = 'INIT'
    STATE_PASS = 'PASS'

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    category = models.CharField(max_length=16)
    rate = models.FloatField()
    high = models.FloatField(blank=True, null=True)
    low = models.FloatField(blank=True, null=True)
    date = models.DateField(blank=True, null=True)


    class Meta:
        db_table = 'user_category_alert'
        unique_together = (('category', 'user'))


    def __str__(self):
        return '<%s id=%s u=%d c=%s r=%s high=%s low=%s>' % \
               (self.__class__.__name__, self.id, self.user.id, self.category,
                self.rate, self.high, self.low)

    def check_state(self, item):
        if not self.high or not self.low or self.date != date.today():
            self.high = item.get('price')
            self.low = item.get('price')
            self.date = date.today()
            self.save()
            return self.STATE_INITED

        if item.get('price') - self.high >= self.rate:
            self.high = item.get('price')
            self.save()
            return self.STATE_NEW_HIGH

        if self.low - item.get('price') >= self.rate:
            self.low = item.get('price')
            self.save()
            return self.STATE_NEW_LOW

        return self.STATE_PASS

    def send_notify(self, log, msg, extra=None):
        result = []
        for device in GCMDevice.objects.filter(user = self.user, cloud_message_type='FCM'):
            log.info('   send to device: %s' % device)
            try:
                result.append(device.send_message(msg, extra=extra))
            except Exception as e:
                log.exception('Cant send notify to user: %s, device: %s' % (self.user, device))
        return result


class StockStat(models.Model):
    symbol = models.CharField(max_length=20)
    val = models.PositiveIntegerField(default=0, blank=True)
    date = models.DateField(default=date.today, blank=True)


    class Meta:
        db_table = 'stock_stat'
        unique_together = (('symbol', 'date'))

    DATE_OFFSET = 3
    TOP_NUM_GROUPS = 3
    TOP_GROUP_MEMBERS = 6

    @classmethod
    def incr(cls, symbol):
        try:
            cls.objects.get_or_create(symbol=symbol, date=date.today())
        except IntegrityError:
            pass
        res = cls.objects.filter(symbol=symbol, date=date.today()).update(val=models.F('val') + 1)
        return res

    @classmethod
    def top(cls):
        items = cls.objects.filter(date__gte=date.today() - timedelta(days=cls.DATE_OFFSET))\
            .values('symbol').annotate(total=models.Sum('val')).order_by('-total')

        top_groups = defaultdict(list)
        for k, v in enumerate(items):
            top_groups['group%d' % (k//cls.TOP_GROUP_MEMBERS)].append(v.get('symbol'))

        return top_groups

    def __str__(self):
        return '<%s symbol=%s date=%s val=%s>' % (self.__class__.__name__,
                                                  self.symbol, self.date, self.date)


class UserQuote(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    symbol = models.CharField(max_length=16)

    class Meta:
        db_table = 'user_quote'
        unique_together = (('symbol', 'user'))

    def __str__(self):
        return '<%s id=%s u=%d c=%s>' % \
               (self.__class__.__name__, self.id, self.user.id, self.symbol)

@receiver(models.signals.post_save, sender=UserQuote)
def on_user_quote_create(sender, instance, **kwargs):
    try:
        StockStat.incr(instance.symbol)
    except:
        pass

@receiver(models.signals.post_save, sender=UserExtremeAlert)
def on_user_quote_create(sender, instance, **kwargs):
    try:
        StockStat.incr(instance.category)
    except:
        pass
