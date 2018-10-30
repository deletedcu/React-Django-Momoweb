from fabric.api import *
from fabric.contrib.console import confirm


def production():
    env.hosts = ['hardel.me']
    env.user = 'lancelot'
    env.repos = [('momo', 'origin', 'master')]
    env.revo = 'momo'


def git_pull():
    "Updates the repository."
    run("cd ~/apps/%(repo)s/; git pull %(parent)s %(branch)s --quiet" % env)


def migrations():
    with cd('~/apps/%(repo)s/src' % env):
        with prefix('source ~/apps/%(repo)s/env/bin/activate' % env):
            run('pip install -q -r requirements.txt')
            run('cp db.sqlite3 ~/backups/$(git rev-parse HEAD).sqlite3')
            run('python manage.py migrate')
            # run('bower install')
            run('supervisorctl restart momo')
            run('compass compile -e production')
            run('python manage.py collectstatic --noinput')
            # run('django-admin compilemessages')


def pull():
    require('hosts', provided_by=[production])
    for repo, parent, branch in env.repos:
        env.repo = repo
        env.parent = parent
        env.branch = branch
        execute(git_pull)
        execute(migrations)


def deploy():
    production()
    # local('git yolo && git push')
    # local('compass compile --production')
    # local('git add --all && git commit && git push')
    for repo, parent, branch in env.repos:
        env.repo = repo
        env.parent = parent
        env.branch = branch
        execute(git_pull)
        execute(migrations)
