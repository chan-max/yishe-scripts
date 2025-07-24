# This program is applied to take 4k images from google art and culture website
from selenium import webdriver
import os, shutil
import time as t
from PIL import Image, ImageChops
import tkinter as tk
from threading import Thread
from tkinter import filedialog
from ctypes import windll


exImg_value = 1

def is_picture(counter):
    im = Image.open('temp/scrapping/image' + str(counter) + '.png')
    rgb_im = im.convert('RGB')
    r, g, b = rgb_im.getpixel((2000, 1300))
    if r == 255 and g == 255 and b == 255:
        return False
    else:
        return True


def is_same(counter):
    if counter > 0:
        prev_counter = counter - 1
        new_file = os.path.getsize('temp/scrapping/image%s.png' % str(counter))
        old_file = os.path.getsize('temp/scrapping/image%s.png' % str(prev_counter))
        os.remove('temp/scrapping/image%s.png' % str(prev_counter))
        if new_file == old_file:
            return True
        else:
            return False


def trim(image):
    bg = Image.new(image.mode, image.size, image.getpixel((0, 0)))
    diff = ImageChops.difference(image, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return image.crop(bbox)


def remove(value, delete_chars):
    for c in delete_chars:
        value = value.replace(c, '')
    return value

def file_save(name, status):
    path = status
    f = filedialog.asksaveasfile(mode='wb', defaultextension=".png", title="Saving picture", initialfile=name, filetypes=(("PNG high resolution image", "*.png"), ("all files", "*.*")))
    if f is None:
        return
    if os.path.abspath(path) != f.name.replace('/', '\\'):
        im = Image.open(path)
        im.save(f)
        os.remove(path)
        f.close()
    else:
        pass
    

def initialize_folders():
    if not os.path.exists('temp'):
        os.makedirs('temp')
    else:
        shutil.rmtree('temp')
    if not os.path.exists('temp/scrapping'):
        os.makedirs('temp/scrapping')

def do_scrapping(url):
    old_url = url
    url = ''

    for char in old_url:
        if char == '?':
            break
        url += char

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--disable-gpu')
    driver = webdriver.Chrome(executable_path=r"chromedriver.exe", chrome_options=options)
    driver.set_window_size(4000, 4000)
    driver.get(url)
    xPath3 = r".//html/body/div[3]/div[3]/div/div/div/div[3]/div"  # img xPath
    xPath2 = r".//html/body/div[3]/div[3]/div/div/div[2]/div[1]/div[2]/div[1]/div"  # zoom xPath
    xPath1 = r".//html/body/div[3]/div[3]/div/div/div[3]/div/content/span"  # open img xPath
    image_appeared = False  # flag for starting click on image
    image_zoom_taked = False
    last_file = ''  # last succeed file
    driver.implicitly_wait(1)
    try:
        authorPic = driver.find_element_by_xpath(r'/html[1]/body[1]/div[3]/div[3]/div[1]/div[1]/div[6]/section[2]/div[1]/ul[1]/li[2]/a[1]').text  # author of the picture xPath
    except Exception:
        authorPic = ''

    try:
        name_pic = driver.find_element_by_xpath(r'/html[1]/body[1]/div[3]/div[3]/div[1]/div[1]/div[6]/section[2]/div[1]/ul[1]/li[1]').text[7::]  # name of the picture xPath
        if authorPic != '':
            name_pic = ' - ' + name_pic
    except Exception:
        name_pic = driver.title[0:-23]

    name_file = authorPic + name_pic
    name_file = remove(name_file, '\/:*?"<>|')
    t.sleep(3)
    for i in range(0, 45):  # 45 attempts
        t.sleep(1)
        if image_appeared:
            t.sleep(3)
            if exImg_value == 1:
                elem2 = driver.find_element_by_xpath(xPath1)
            else:
                elem2 = driver.find_element_by_xpath(xPath2)
            elem3 = driver.find_element_by_xpath(xPath3)
            driver.execute_script("arguments[0].click();", elem2)
            driver.execute_script("arguments[0].click();", elem3)
            t.sleep(3)
            image_appeared = False
            image_zoom_taked = True
        else:
            pass
        driver.save_screenshot('temp/scrapping/image%s.png' % str(i))

        if is_picture(i) and not image_zoom_taked:
            image_appeared = True
        if is_same(i):
            last_file = 'temp/scrapping/image%s.png' % str(i)
            break
    driver.quit()
    return last_file, name_file

def do_finally_changes(last_file, name_file):
    if last_file != '':
        shutil.copyfile(last_file, 'temp/image_result.png')
        shutil.rmtree('temp/scrapping')
        imOp = Image.open('temp/image_result.png')
        if exImg_value == 1:
            im = imOp.crop((0, 50, 4000, 4000))  # 20!8
        else:
            im = imOp
        im = trim(im)
        im.save("Ukiyo/" + name_file + '.png')
        shutil.rmtree('temp')
        return name_file
    return 'An error occurred with processing image'

def start_process(index, url):
    print("initialize_folders()")
    initialize_folders()
    print("do_scrapping({0})".format(url))
    file, name = do_scrapping(url)
    print("saving image {0}".format(str(url.split("/")[-1])+ '.png'))
    status = do_finally_changes(file, str(url.split("/")[-1]))
#     file_save(status + '.png', status + '.png')
    with open("log.txt","a",encoding="utf8") as log_file:
        log_file.write(str(index)+" : "+url+"\n")

def start():
    with open("asserts.txt",'r',encoding="utf8") as read_file:
        for index, line in enumerate(read_file.readlines()):
            url = "https://artsandculture.google.com" + line.strip()
            print(index, url)
            start_process(index, url)  
path = "Ukiyo"
if not os.path.exists(path):
    os.makedirs(path)
start()

# start_process(0，"https://artsandculture.google.com/asset/sanjūrokkasen/RQEYzE71xKwOlQ")
