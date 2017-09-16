#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
Created on Sat Sep  2 10:44:51 2017

@author: rodgeryuan
"""
import requests
import pandas as pd
import numpy as np

def distance_url(link_year, distance):
    
    url = 'http://stats.nba.com/stats/leaguedashplayerptshot?' + \
        'CloseDefDistRange=' + \
        distance + \
        '&College=&Conference=&' + \
        'Country=&DateFrom=&DateTo=&Division=&DraftPick=&DraftYear=&' + \
        'DribbleRange=&GameScope=&GameSegment=&GeneralRange=&Height=&' + \
        'LastNGames=0&LeagueID=00&Location=&Month=0&OpponentTeamID=0&' + \
        'Outcome=&PORound=0&PaceAdjust=N&PerMode=Totals&Period=0&' + \
        'PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=' + \
        link_year + \
        '&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&' + \
        'ShotDistRange=&StarterBench=&TeamID=0&TouchTimeRange=&' + \
        'VsConference=&VsDivision=&Weight='
    
    return url

def get_json(url):
    
    return requests.get(
                url, headers = {'User-Agent': 'Mozilla/5.0'}
                ).json()['resultSets'][0]['rowSet'] 

def get_player_dictionary(link_year, total_players):
    
    player_dictionary = {}
    
    player_stats_url = 'http://stats.nba.com/stats/leaguedashplayerstats?' + \
    'College=&Conference=&Country=&DateFrom=&DateTo=&Division=&DraftPick=&' + \
    'DraftYear=&GameScope=&GameSegment=&Height=&LastNGames=0&LeagueID=00&' + \
    'Location=&MeasureType=Base&Month=0&OpponentTeamID=0&Outcome=&' + \
    'PORound=0&PaceAdjust=N&PerMode=Totals&Period=0&PlayerExperience=&' + \
    'PlayerPosition=&PlusMinus=N&Rank=N&Season=' + \
    link_year + \
    '&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&StarterBench=&TeamID=0&' + \
    'VsConference=&VsDivision=&Weight='
    
    all_stats = get_json(player_stats_url)
    
    all_stats_sorted = sorted(all_stats, key = lambda player: -player[11]) #FGA
    
    for index in range(total_players):
        #FREQ, FGA, eFG for 4 defender distances
        player_dictionary[all_stats_sorted[index][1]] = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]]

    return player_dictionary

def main():
    
    years = range(2013,2017)
    
    for year in years:
        
        link_year = str(year) + '-' + str(year+1)[2:4]
        
        print ('DOING YEAR: ' + link_year)
        
        verytight_url = distance_url(link_year, '0-2+Feet+-+Very+Tight')
        tight_url = distance_url(link_year, '2-4+Feet+-+Tight')
        open_url = distance_url(link_year, '4-6+Feet+-+Open')
        wideopen_url = distance_url(link_year, '6%2B+Feet+-+Wide+Open')
        
        distance_array = ['0-2 Feet', '2-4 Feet', '4-6 Feet', '6+ Feet']

        verytight_response = get_json(verytight_url)
        tight_response = get_json(tight_url)
        open_response = get_json(open_url)
        wideopen_response = get_json(wideopen_url)
        
        player_dictionary = get_player_dictionary(link_year, 50)
        
        for player in verytight_response:
            if player[1] in player_dictionary:
                player_dictionary[player[1]][0][0] = player[7] #FREQ
                player_dictionary[player[1]][0][1] = player[9] #FGA
                player_dictionary[player[1]][0][2] = player[11] #eFG
        
        for player in tight_response:
            if player[1] in player_dictionary:
                player_dictionary[player[1]][1][0] = player[7] #FREQ
                player_dictionary[player[1]][1][1] = player[9] #FGA
                player_dictionary[player[1]][1][2] = player[11] #eFG
                
        for player in open_response:
            if player[1] in player_dictionary:
                player_dictionary[player[1]][2][0] = player[7] #FREQ
                player_dictionary[player[1]][2][1] = player[9] #FGA
                player_dictionary[player[1]][2][2] = player[11] #eFG
                
        for player in wideopen_response:
            if player[1] in player_dictionary:
                player_dictionary[player[1]][3][0] = player[7] #FREQ
                player_dictionary[player[1]][3][1] = player[9] #FGA
                player_dictionary[player[1]][3][2] = player[11] #eFG
        
        data_array = []
        
        for key, item in player_dictionary.items():
            for index in range(len(item)):
                data_array.append([key] + [distance_array[index]] + item[index])

        data = pd.DataFrame(data_array, columns = ['name', 'dis', 'freq', 'fga', 
                                                   'eFG'])
    
        data.to_csv('../../data/' + link_year + '_closestdefender.csv', index = False)

