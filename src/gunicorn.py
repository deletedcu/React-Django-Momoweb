import multiprocessing
import os

bind = '0.0.0.0:9090'
workers = multiprocessing.cpu_count() + 1
max_requests=256
user='www-data'
group='www-data'
accesslog='/opt/momoweb/logs/gunicorn-access.log'
errorlog='/opt/momoweb/logs/gunicorn-error.log'
pythonpath=os.path.dirname(os.path.realpath(__file__))

